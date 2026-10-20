import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { driverHarness } from './driver.fixture';
import { decodeState } from '../src/store/persistence';

test('pickup, custody, plant, delivery, recipient and evidence survive reload', () => {
  const h = driverHarness();
  h.run(repo => repo.demoLogin('DRIVER'));
  const order = h.state.orders.find(order => order.id === 'SOL-4587')!;
  const id = order.id, count = h.state.driver.completedDeliveriesCount;
  h.run(repo => repo.driverAction(id, 'ARRIVE_PICKUP'));
  const before = JSON.stringify(h.state);
  assert.throws(() => h.run(repo => repo.driverConfirmPickup(id, 7, '', undefined, 'incorrecto')), /código/);
  assert.equal(JSON.stringify(h.state), before);
  h.run(repo => repo.driverConfirmPickup(id, 7, 'Bolsa sellada', 'demo://recogida'));
  h.run(repo => repo.driverAction(id, 'GO_FACILITY'));
  h.run(repo => repo.driverAction(id, 'ARRIVE_FACILITY'));
  for (let step = 0; step < 4; step++) h.run(repo => repo.advancePlantOperation(id));
  assert.equal(h.state.orders.find(order => order.id === id)!.status, 'DELIVERY_ASSIGNED');
  h.run(repo => repo.driverAction(id, 'START_DELIVERY'));
  h.run(repo => repo.driverAction(id, 'ARRIVE_DELIVERY'));
  h.run(repo => repo.driverConfirmDelivery(id, 'Ana Torres', 'Familiar', 'Recepción conforme', 'demo://entrega'));
  const saved = decodeState(JSON.stringify(h.state));
  const completed = saved.orders.find(order => order.id === id)!;
  assert.equal(completed.status, 'DELIVERED');
  assert.equal(completed.pickup.garmentCountConfirmed, 7);
  assert.equal(completed.pickup.evidencePhotoUri, 'demo://recogida');
  assert.equal(completed.delivery.recipientName, 'Ana Torres');
  assert.equal(completed.delivery.evidencePhotoUri, 'demo://entrega');
  assert.equal(completed.handoffs.filter(handoff => handoff.status === 'USED').length, 4);
  assert.equal(saved.driver.completedDeliveriesCount, count + 1);
  assert.throws(() => h.run(repo => repo.driverConfirmDelivery(id, 'Otra persona', 'Cliente', '')), /llegada/);
});

test('pick up finishes at the facility without creating a home delivery', () => {
  const h = driverHarness();
  h.run(repo => repo.demoLogin('DRIVER'));
  const order = h.state.orders.find(order => order.id === 'SOL-HS-001')!;
  assert.equal(order.fulfillmentPlan.mode, 'HOME_STORE');
  assert.throws(() => h.run(repo => repo.driverAction(order.id, 'START_DELIVERY')), /estado/);
  h.run(repo => repo.advancePlantOperation(order.id));
  assert.equal(h.state.orders.find(item => item.id === order.id)!.status, 'COMPLETED');
  assert.equal(h.state.driver.completedDeliveriesCount, 34);
});

test('availability, assignment and payment guards remain mandatory', () => {
  const h = driverHarness();
  h.run(repo => repo.demoLogin('DRIVER'));
  h.run(repo => repo.setDriverOperationalStatus('BREAK'));
  assert.throws(() => h.run(repo => repo.driverAction('SOL-4587', 'ARRIVE_PICKUP')), /disponible/);
  h.run(repo => repo.setDriverOperationalStatus('AVAILABLE'));
  h.state.orders[0].assignedDriverId = 'otro-chofer';
  assert.throws(() => h.run(repo => repo.driverAction(h.state.orders[0].id, 'ARRIVE_PICKUP')), /acceso/);
  const order = h.state.orders.find(order => order.assignedDriverId === h.state.driver.id)!;
  order.status = 'DELIVERY_ASSIGNED'; order.paymentStatus = 'PENDIENTE';
  assert.throws(() => h.run(repo => repo.driverAction(order.id, 'START_DELIVERY')), /pago/);
});

import { Body, Check, Field } from "../../../components/ui";
import { type Order } from "../../../domain/models";
import {
  DriverSectionTitle,
  DriverServiceMeta,
  driverServiceStyles,
} from "../../../components/DriverServicePresentation";
export function PickupGarmentFields({
  order,
  count,
  setCount,
  checked,
  setChecked,
}: {
  order: Order;
  count: string;
  setCount(value: string): void;
  checked: boolean;
  setChecked(value: boolean): void;
}) {
  return (
    <>
      <DriverSectionTitle icon="shirt-outline">
        Recepción de prendas
      </DriverSectionTitle>
      <DriverServiceMeta icon="person-outline">
        <Body style={driverServiceStyles.text}>
          {order.customerName} · {order.pickup.addressFull}
        </Body>
      </DriverServiceMeta>
      {order.items.map((i) => (
        <Body
          key={i.id}
          style={[driverServiceStyles.text, driverServiceStyles.garment]}
        >
          {i.quantity} × {i.garmentType}
        </Body>
      ))}
      <Field
        label="Cantidad de prendas recibidas"
        labelStyle={driverServiceStyles.label}
        style={driverServiceStyles.count}
        validate={(value) =>
          !Number.isInteger(Number(value)) || Number(value) < 1
            ? "Ingresa una cantidad entera mayor a cero."
            : undefined
        }
        value={count}
        onChangeText={setCount}
        keyboardType="number-pad"
      />
      <Check
        label="Verifiqué las prendas con el cliente"
        style={[
          driverServiceStyles.check,
          checked && driverServiceStyles.checked,
        ]}
        checked={checked}
        onChange={setChecked}
      />
    </>
  );
}

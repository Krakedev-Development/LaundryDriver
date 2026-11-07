import { contentColors } from "../design-system/classic";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Button, Card, Icon, Title, ui } from "./ui";
import { StatusChip } from "./presentation";
import { OrderMetadata, ordersStyles } from "./OrdersPresentation";
import { tactile } from "../design-system/interaction";
import {
  canTrack,
  garmentCount,
  modeLabels,
  money,
  pickupStatuses,
  type Order,
} from "../domain/models";

export function OrderCard({
  order,
  onDetail,
  onTrack,
  appearance = "default",
}: {
  order: Order;
  onDetail(): void;
  onTrack?(): void;
  appearance?: "default" | "home" | "orders";
}) {
  const home = appearance === "home";
  const orders = appearance === "orders";
  const isPickup = pickupStatuses.includes(order.status);
  const address = isPickup
    ? order.pickup.addressFull
    : order.delivery.addressFull;
  const slotDate = isPickup ? order.pickup.date : order.delivery.date;
  const slotTime = isPickup ? order.pickup.timeSlot : order.delivery.timeSlot;

  return (
    <Card
      style={[
        { padding: 0 },
        home && homeOrderStyles.card,
        orders && ordersStyles.card,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Ver detalle de " + order.id}
        onPress={() => {
          tactile("selection");
          onDetail();
        }}
        style={({ pressed }) => ({
          padding: home ? 14 : 16,
          gap: 8,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        <View
          style={
            orders
              ? ordersStyles.header
              : [ui.row, { justifyContent: "space-between" }]
          }
        >
          <View style={styles.idRow}>
            <Title
              style={orders ? ordersStyles.id : home && homeOrderStyles.title}
            >
              {order.id}
            </Title>
            {orders && (
              <View
                style={[
                  styles.legPill,
                  isPickup ? styles.legPickup : styles.legDelivery,
                ]}
              >
                <Text
                  style={[
                    styles.legPillText,
                    { color: isPickup ? "#92400E" : "#166534" },
                  ]}
                >
                  {isPickup ? "RECOGIDA" : "ENTREGA"}
                </Text>
              </View>
            )}
          </View>
          <OrderMetadataContainer
            active={orders}
            style={ordersStyles.headerStatus}
          >
            {orders && <StatusChip status={order.status} />}
            <Icon name="chevron-forward" size={18} color="#64748B" />
          </OrderMetadataContainer>
        </View>
        {!orders && <StatusChip status={order.status} />}
        <OrderMetadataRow active={orders} icon="person-outline">
          <Body
            muted={!orders}
            style={orders ? ordersStyles.mode : home && homeOrderStyles.caption}
          >
            {order.customerName} · {modeLabels[order.fulfillmentPlan.mode]}
          </Body>
        </OrderMetadataRow>
        {orders && (
          <OrderMetadataRow active={orders} icon="location-outline">
            <Body muted style={ordersStyles.service}>
              {address}
            </Body>
          </OrderMetadataRow>
        )}
        <OrderMetadataRow active={orders} icon="cube-outline">
          <Body
            muted
            style={
              orders ? ordersStyles.service : home && homeOrderStyles.caption
            }
          >
            {order.pricingModel === "PER_WEIGHT"
              ? "Bulto por peso · $2.20 / lb"
              : garmentCount(order) +
                " prendas · " +
                (order.items[0]?.serviceType ?? "Lavado y cuidado")}
          </Body>
        </OrderMetadataRow>
        <View
          style={[
            orders ? ordersStyles.footer : ui.row,
            {
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: orders
                ? "#F1F5F9"
                : home
                  ? "#BFDBFE"
                  : contentColors.divider,
              paddingTop: 8,
              marginTop: 4,
            },
          ]}
        >
          <OrderMetadataContainer active={orders} style={ordersStyles.time}>
            {orders && <Icon name="time-outline" size={13} color="#64748B" />}
            <Body
              muted
              style={
                orders ? ordersStyles.caption : home && homeOrderStyles.caption
              }
            >
              {slotDate} · {slotTime}
            </Body>
          </OrderMetadataContainer>
          <Body
            style={
              orders ? ordersStyles.amount : home && homeOrderStyles.amount
            }
          >
            {order.pricingStatus === "PENDING_WEIGHT"
              ? "Monto por determinar"
              : money(order.pricing.total)}
          </Body>
        </View>
      </Pressable>
      {onTrack && canTrack(order) && (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <Button
            label="Seguir chofer"
            icon="navigate-outline"
            secondary
            style={orders && ordersStyles.trackAction}
            textStyle={orders && ordersStyles.trackText}
            onPress={onTrack}
          />
        </View>
      )}
    </Card>
  );
}

function OrderMetadataRow({
  active,
  icon,
  children,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof Icon>["name"];
  children: React.ReactNode;
}) {
  return active ? (
    <OrderMetadata icon={icon}>{children}</OrderMetadata>
  ) : (
    <>{children}</>
  );
}

function OrderMetadataContainer({
  active,
  style,
  children,
}: {
  active: boolean;
  style: React.ComponentProps<typeof View>["style"];
  children: React.ReactNode;
}) {
  return active ? <View style={style}>{children}</View> : <>{children}</>;
}

const styles = StyleSheet.create({
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  legPickup: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  legDelivery: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  legPillText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

const homeOrderStyles = StyleSheet.create({
  card: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  title: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: "#1D4ED8" },
  caption: { color: contentColors.primary, fontSize: 12, lineHeight: 18 },
  amount: { color: contentColors.primary, fontWeight: "700" },
});

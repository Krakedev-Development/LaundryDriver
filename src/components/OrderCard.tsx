import { contentColors } from "../design-system/classic";
import { Pressable, StyleSheet, View } from "react-native";
import { Body, Button, Card, Icon, Title, ui } from "./ui";
import { StatusChip } from "./presentation";
import { OrderMetadata, ordersStyles } from "./OrdersPresentation";
import {
  canTrack,
  garmentCount,
  modeLabels,
  money,
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
        onPress={onDetail}
        style={({ pressed }) => ({
          padding: home ? 14 : 16,
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View
          style={
            orders
              ? ordersStyles.header
              : [ui.row, { justifyContent: "space-between" }]
          }
        >
          <Title
            style={orders ? ordersStyles.id : home && homeOrderStyles.title}
          >
            {order.id}
          </Title>
          <OrderMetadataContainer
            active={orders}
            style={ordersStyles.headerStatus}
          >
            {orders && <StatusChip status={order.status} />}
            <Icon name="chevron-forward" size={18} />
          </OrderMetadataContainer>
        </View>
        {!orders && <StatusChip status={order.status} />}
        <OrderMetadataRow active={orders} icon="location-outline">
          <Body
            muted
            style={orders ? ordersStyles.mode : home && homeOrderStyles.caption}
          >
            {modeLabels[order.fulfillmentPlan.mode]}
          </Body>
        </OrderMetadataRow>
        <OrderMetadataRow active={orders} icon="water-outline">
          <Body
            muted
            style={
              orders ? ordersStyles.service : home && homeOrderStyles.caption
            }
          >
            {order.pricingModel === "PER_WEIGHT"
              ? "Ropa por peso · $2.20 / lb"
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
                ? "#F3F4F6"
                : home
                  ? "#BFDBFE"
                  : contentColors.divider,
              paddingTop: 8,
              marginTop: 4,
            },
          ]}
        >
          <OrderMetadataContainer active={orders} style={ordersStyles.time}>
            {orders && <Icon name="time-outline" size={12} color="#9CA3AF" />}
            <Body
              muted
              style={
                orders ? ordersStyles.caption : home && homeOrderStyles.caption
              }
            >
              {order.pickup.date} · {order.pickup.timeSlot}
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

import { FlatList, View } from "react-native";
import type { Order } from "../domain/models";
import { OrderCard } from "./OrderCard";
import { Button, Empty } from "./ui";
export function OrderList({
  orders,
  onDetail,
  onTrack,
  onClear,
  appearance = "default",
}: {
  orders: Order[];
  onDetail(order: Order): void;
  onTrack?(order: Order): void;
  onClear?(): void;
  appearance?: "default" | "orders";
}) {
  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          appearance={appearance}
          onDetail={() => onDetail(item)}
          onTrack={onTrack ? () => onTrack(item) : undefined}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListEmptyComponent={
        <Empty
          title="No hay solicitudes"
          text="Prueba con otra búsqueda o cambia los filtros."
          action={
            onClear && (
              <Button label="Limpiar filtros" secondary onPress={onClear} />
            )
          }
        />
      }
      contentContainerStyle={{ paddingBottom: 20 }}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      windowSize={5}
    />
  );
}

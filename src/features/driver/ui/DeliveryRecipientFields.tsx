import { ListItem } from "../../../components/presentation";
import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Choice, Field, Icon, Title, contentColors } from "../../../components/ui";
import { driverServiceStyles } from "../../../components/DriverServicePresentation";

const relationships = [
  "Cliente",
  "Familiar",
  "Conserje",
  "Otro autorizado",
] as const;

export function DeliveryRecipientFields({
  name,
  setName,
  relationship,
  setRelationship,
}: {
  name: string;
  setName(value: string): void;
  relationship: string;
  setRelationship(value: string): void;
}) {
  const [relationshipPanel, setRelationshipPanel] = useState(false);
  return (
    <>
      <View style={styles.sectionHeader}>
        <View style={styles.iconBadge}>
          <Icon
            name="person-outline"
            size={18}
            color={contentColors.primary}
          />
        </View>
        <Title style={driverServiceStyles.title}>Confirma quién recibe</Title>
      </View>
      <Field
        label="Nombre de quien recibe"
        leadingIcon="person-outline"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.selectorCard}>
        <ListItem
          title="Relación con el cliente"
          subtitle={relationship}
          icon="people-outline"
          onPress={() => setRelationshipPanel(true)}
        />
      </View>
      <BottomSheet
        title="Quién recibe"
        visible={relationshipPanel}
        onClose={() => setRelationshipPanel(false)}
      >
        {relationships.map((rel) => (
          <Choice
            key={rel}
            label={rel}
            selected={relationship === rel}
            onPress={() => {
              setRelationship(rel);
              setRelationshipPanel(false);
            }}
          />
        ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: contentColors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
  },
});

import { ListItem } from "../../../components/presentation";
import { BottomSheet } from "../../../components/overlay/OverlayPortal";
import { useState } from "react";
import { Choice, Field, Title } from "../../../components/ui";
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
      <Title>Confirma quién recibe</Title>
      <Field
        label="Nombre de quien recibe"
        value={name}
        onChangeText={setName}
      />
      <ListItem
        title="Relación con el cliente"
        subtitle={relationship}
        icon="people-outline"
        onPress={() => setRelationshipPanel(true)}
      />
      <BottomSheet
        title="Quién recibe"
        visible={relationshipPanel}
        onClose={() => setRelationshipPanel(false)}
      >
        {["Cliente", "Familiar", "Conserje", "Otro autorizado"].map((rel) => (
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

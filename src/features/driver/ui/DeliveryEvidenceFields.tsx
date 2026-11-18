import { View } from "react-native";
import { Accordion } from "../../../components/presentation";
import { Body, Button, Card, Field, Title } from "../../../components/ui";
import { PhotoAttachment } from "../../../components/PhotoAttachment";
import { QrScanner } from "../../../components/QrScanner";
import { describeCustodyInput } from "../model/custody";

export function DeliveryEvidenceFields({
  notes,
  setNotes,
  photo,
  setPhoto,
  code,
  setCode,
}: {
  notes: string;
  setNotes(value: string): void;
  photo?: string;
  setPhoto(value: string | undefined): void;
  code: string;
  setCode(value: string): void;
}) {
  const scanned = describeCustodyInput(code);
  return (
    <>
      {/* La custodia es obligatoria: sin el código o QR del cliente no se entrega la ropa. */}
      <Card style={{ gap: 10 }}>
        <Title>Código del cliente</Title>
        <Body muted>
          Pide al cliente que toque «Mostrar código» en su app. Escanea su QR o escribe los 6
          dígitos.
        </Body>
        {scanned ? (
          <View testID="custody_scanned" style={{ gap: 8 }}>
            <Body>{scanned}</Body>
            <Button label="Usar otro código" secondary onPress={() => setCode("")} />
          </View>
        ) : (
          <Field
            label="Código de 6 dígitos"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
          />
        )}
        <QrScanner onScan={setCode} />
      </Card>
      <Accordion title="Observaciones y evidencia (opcional)">
        <Field
          label="Observaciones de entrega"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <PhotoAttachment
          label="Evidencia de entrega (opcional)"
          uri={photo}
          onChange={setPhoto}
        />
      </Accordion>
    </>
  );
}

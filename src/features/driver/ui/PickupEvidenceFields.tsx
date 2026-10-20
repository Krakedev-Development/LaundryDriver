import { Accordion } from "../../../components/presentation";
import { Body, Card, Field } from "../../../components/ui";
import { PhotoAttachment } from "../../../components/PhotoAttachment";
import { QrScanner } from "../../../components/QrScanner";
import { driverServiceStyles } from "../../../components/DriverServicePresentation";
export function PickupEvidenceFields({
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
  return (
    <Card style={driverServiceStyles.accordionCard}>
      <Accordion title="Observaciones y evidencia (opcional)" appearance="list">
        <Field
          label="Observaciones de recogida"
          labelStyle={driverServiceStyles.label}
          style={driverServiceStyles.input}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <PhotoAttachment
          label="Evidencia de recogida (opcional)"
          uri={photo}
          onChange={setPhoto}
        />
        <Field
          label="Código de transferencia (opcional)"
          labelStyle={driverServiceStyles.label}
          style={driverServiceStyles.input}
          value={code}
          onChangeText={setCode}
        />
        <QrScanner onScan={setCode} />
        <Body muted style={driverServiceStyles.notice}>
          Si introduces un código, debe corresponder a esta recogida.
        </Body>
      </Accordion>
    </Card>
  );
}

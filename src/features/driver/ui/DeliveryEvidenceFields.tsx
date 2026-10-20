import { Accordion } from "../../../components/presentation";
import { Field } from "../../../components/ui";
import { PhotoAttachment } from "../../../components/PhotoAttachment";
import { QrScanner } from "../../../components/QrScanner";
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
  return (
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
      <Field
        label="Código de entrega (opcional)"
        value={code}
        onChangeText={setCode}
      />
      <QrScanner onScan={setCode} />
    </Accordion>
  );
}

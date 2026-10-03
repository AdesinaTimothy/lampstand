export type RichTextEditorProps = {
  /** HTML. Treated as the initial value; later external changes are applied when the editor isn't focused. */
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Applied to the editable region so a `<label htmlFor>` can point at it. */
  id?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  minHeight?: string;
  className?: string;
  allowImages?: boolean;
};

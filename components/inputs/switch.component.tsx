import styles from "./switch.module.scss";

// TODO add style props and disabled
type Props = {
  checked: boolean;
  label?: string;
  onChange: (checked: boolean) => void;
};

const Switch = ({ checked, label, onChange }: Props) => {
  return (
    <div className={styles.switch_toggle}>
      {label && <h3>{label}</h3>}
      <div
        className={`${styles.switch} ${checked ? styles.checked : ""}`}
        onClick={() => onChange(!checked)}
      >
        <div className={styles.switch_thumb} />
      </div>
    </div>
  );
};

export default Switch;

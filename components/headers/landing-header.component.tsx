import MainHeaderCurves from "@/assets/main-header-curves";
import Link from "next/link";
import Button from "../button/button.component";
import { ButtonColor, ButtonSize, ButtonStyle } from "../button/button.types";
import styles from "./landing-header.module.scss";

const LandingHeader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div></div>
        <MainHeaderCurves />
      </div>
      <div className={styles.content}>
        <h1>Poliżarcie</h1>
        <div className={styles.buttons}>
          <Link href={"/browse"}>
            <Button
              style={ButtonStyle.BACKDROP}
              size={ButtonSize.LARGE}
              color={ButtonColor.TEXT}
            >
              Wejdź w świat poliżarcia
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingHeader;

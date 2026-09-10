"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const APK_PATH = "/predict-app.apk";
const APP_NAME = "Predict App";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export default function DownloadPage() {
  const [downloadUrl, setDownloadUrl] = useState(APK_PATH);
  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setDownloadUrl(`${window.location.origin}${APK_PATH}`);
  }, []);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />

      <section className={styles.card} aria-labelledby="app-title">
        <div className={styles.topline}>
          <span className={styles.brand}>PREDICT <b>APP</b></span>
          <span className={styles.safe}><span /> Official APK</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.appIcon} aria-hidden="true">
            <span className={styles.ring} />
            <span className={styles.arrow}>↗</span>
          </div>
          <div>
            <p className={styles.eyebrow}>SMART PREDICTION EXPERIENCE</p>
            <h1 id="app-title">{APP_NAME}</h1>
            <p className={styles.description}>
              A clean, fast mobile app for following your prediction activity in one place.
            </p>
          </div>
        </div>

        <div className={styles.stats}>
          <div><b>v1.0.0</b><span>Version</span></div>
          <div><b>44.2 MB</b><span>APK size</span></div>
          <div><b>Android 8+</b><span>Required</span></div>
        </div>

        <a
          className={styles.downloadButton}
          href={APK_PATH}
          download="predict-app.apk"
          onClick={() => setStarted(true)}
        >
          <DownloadIcon />
          <span>{started ? "Download started" : "Download APK"}</span>
          <small>Free</small>
        </a>
        <p className={styles.downloadNote}>Tap the button once to download the APK to your device.</p>

        <div className={styles.infoPanel}>
          <div className={styles.infoHead}>
            <div>
              <p>DOWNLOAD DETAILS</p>
              <h2>Quick install</h2>
            </div>
            <span className={styles.android}>Android</span>
          </div>
          <div className={styles.detailRow}>
            <span>App name</span><b>{APP_NAME}</b>
          </div>
          <div className={styles.detailRow}>
            <span>File name</span><b>predict-app.apk</b>
          </div>
          <div className={styles.urlRow}>
            <div>
              <span>DOWNLOAD URL</span>
              <b title={downloadUrl}>{downloadUrl}</b>
            </div>
            <button type="button" onClick={copyUrl} aria-label="Copy download URL">
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className={styles.steps}>
          <div><i>1</i><span>Download the APK</span></div>
          <div><i>2</i><span>Open the downloaded file</span></div>
          <div><i>3</i><span>Allow install if Android asks</span></div>
        </div>

        <a className={styles.secondaryButton} href={APK_PATH} download="predict-app.apk" onClick={() => setStarted(true)}>
          <DownloadIcon /> Get {APP_NAME}
        </a>
      </section>
    </main>
  );
}

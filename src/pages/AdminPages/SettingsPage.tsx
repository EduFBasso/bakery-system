import { useEffect, useState } from 'react';
import {
  fetchTelegramStatus,
  sendTelegramTest,
  startTelegramLink,
  verifyTelegramLink,
} from '../../services/telegramLink';
import styles from './SettingsPage.module.css';

interface SettingsPageProps {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function SettingsPage({ onError, onSuccess }: SettingsPageProps) {
  const [linked, setLinked] = useState(false);
  const [linkActive, setLinkActive] = useState(false);
  const [username, setUsername] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startToken, setStartToken] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => {
    fetchTelegramStatus()
      .then((snapshot) => {
        setLinked(snapshot.telegramLinked);
        setLinkActive(snapshot.telegramLinkActive);
        setUsername(snapshot.telegramUsername);
      })
      .catch(() => {
        // Status inicial é opcional; o admin ainda pode conectar do zero.
      });
  }, []);

  const connected = linked && linkActive;

  async function handleStart() {
    setLinkBusy(true);
    try {
      const result = await startTelegramLink();
      setLinkUrl(result.linkUrl);
      setStartToken(result.startToken);
      window.open(result.linkUrl, '_blank', 'noopener,noreferrer');
      onSuccess?.('Link gerado. Abra no Telegram e toque em Iniciar.');
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erro ao iniciar vínculo com Telegram.');
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleVerify() {
    if (!startToken) {
      onError?.('Primeiro gere o link de conexão do Telegram.');
      return;
    }
    setLinkBusy(true);
    try {
      const snapshot = await verifyTelegramLink(startToken);
      setLinked(snapshot.telegramLinked);
      setLinkActive(snapshot.telegramLinkActive);
      setUsername(snapshot.telegramUsername);
      setLinkUrl('');
      setStartToken('');
      onSuccess?.('Telegram conectado com sucesso.');
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Ainda não foi possível confirmar o vínculo.'
      );
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleTest() {
    setTestBusy(true);
    try {
      await sendTelegramTest();
      onSuccess?.('Mensagem de teste enviada com sucesso!');
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erro ao enviar teste.');
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.title}>Notificações Telegram</p>
      <p className={styles.subtitle}>
        Conecte sua conta para receber um aviso no Telegram sempre que um novo pedido for
        realizado.
      </p>

      <div className={styles.statusRow}>
        <strong className={connected ? styles.statusConnected : styles.statusDisconnected}>
          {connected ? `Conectado${username ? ` (@${username})` : ''}` : 'Não conectado'}
        </strong>
      </div>

      <div className={styles.actionRow}>
        <button type="button" onClick={() => void handleStart()} disabled={linkBusy}>
          Conectar Telegram
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => void handleVerify()}
          disabled={linkBusy || !startToken}
        >
          Verificar conexão
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => void handleTest()}
          disabled={testBusy || !connected}
          title={!connected ? 'Conecte o Telegram primeiro' : ''}
        >
          {testBusy ? 'Enviando...' : 'Enviar teste'}
        </button>
      </div>

      {!!linkUrl && !connected && (
        <div className={styles.helperRow}>
          Não abriu automaticamente? <a href={linkUrl}>Abrir Telegram</a>
        </div>
      )}
    </div>
  );
}

import { FormEvent, useEffect, useState } from 'react';
import {
  fetchTelegramStatus,
  sendTelegramTest,
  startTelegramLink,
  verifyTelegramLink,
} from '../../../services/telegramLink';
import { ApiService } from '../../../services/api';
import { BakeryTenantProfile } from '../../../types';
import styles from './AdminSettingsPage.module.css';

interface AdminSettingsPageProps {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  onTenantUpdated?: (tenant: BakeryTenantProfile) => void;
}

export function AdminSettingsPage({ onError, onSuccess, onTenantUpdated }: AdminSettingsPageProps) {
  const [linked, setLinked] = useState(false);
  const [linkActive, setLinkActive] = useState(false);
  const [username, setUsername] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startToken, setStartToken] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [tenantProfile, setTenantProfile] = useState<BakeryTenantProfile | null>(null);
  const [tenantBusy, setTenantBusy] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [cepLookupBusy, setCepLookupBusy] = useState(false);
  const [cepLookupError, setCepLookupError] = useState('');

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

  useEffect(() => {
    ApiService.getTenantProfile()
      .then((profile) => setTenantProfile(profile))
      .catch((error) =>
        onError?.(error instanceof Error ? error.message : 'Erro ao carregar a empresa.')
      )
      .finally(() => setTenantLoading(false));
  }, [onError]);

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

  async function handleZipCodeChange(zipCode: string) {
    const cleanZipCode = zipCode.replace(/\D/g, '').slice(0, 8);
    const formattedZipCode =
      cleanZipCode.length > 5
        ? `${cleanZipCode.slice(0, 5)}-${cleanZipCode.slice(5)}`
        : cleanZipCode;

    setTenantProfile((previous) =>
      previous ? { ...previous, zip_code: formattedZipCode } : previous
    );
    setCepLookupError('');

    if (cleanZipCode.length !== 8) return;

    setCepLookupBusy(true);
    try {
      const address = await ApiService.lookupCEP(cleanZipCode);
      setTenantProfile((previous) =>
        previous
          ? {
              ...previous,
              zip_code: address.zip_code || formattedZipCode,
              street: address.street || '',
              neighborhood: address.neighborhood || '',
              city: address.city || '',
              state: address.state || '',
            }
          : previous
      );
    } catch (error) {
      setCepLookupError(error instanceof Error ? error.message : 'CEP não encontrado.');
    } finally {
      setCepLookupBusy(false);
    }
  }

  async function handleTenantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantProfile) return;

    setTenantBusy(true);
    try {
      const updated = await ApiService.updateTenantProfile({
        trade_name: tenantProfile.trade_name,
        zip_code: tenantProfile.zip_code,
        street: tenantProfile.street,
        number: tenantProfile.number,
        neighborhood: tenantProfile.neighborhood,
        city: tenantProfile.city,
        state: tenantProfile.state,
        complement: tenantProfile.complement,
      });
      setTenantProfile(updated);
      onTenantUpdated?.(updated);
      onSuccess?.('Dados da empresa atualizados com sucesso.');
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erro ao salvar os dados da empresa.');
    } finally {
      setTenantBusy(false);
    }
  }

  return (
    <>
      <form className={styles.card} onSubmit={(event) => void handleTenantSubmit(event)}>
        <p className={styles.title}>Dados da empresa</p>
        <p className={styles.subtitle}>Atualize o nome exibido e o endereço da sua padaria.</p>

        {tenantLoading && <p className={styles.helperRow}>Carregando dados da empresa...</p>}
        {tenantProfile && (
          <div className={styles.formGrid}>
            <label>
              Nome fantasia
              <input
                value={tenantProfile.trade_name}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, trade_name: event.target.value })
                }
                required
              />
            </label>
            <label>
              CEP
              <input
                value={tenantProfile.zip_code}
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
                onChange={(event) => void handleZipCodeChange(event.target.value)}
              />
              {cepLookupBusy && <span className={styles.fieldHint}>Consultando CEP...</span>}
              {cepLookupError && <span className={styles.fieldError}>{cepLookupError}</span>}
            </label>
            <label className={styles.wideField}>
              Rua / avenida
              <input
                value={tenantProfile.street}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, street: event.target.value })
                }
              />
            </label>
            <label>
              Número
              <input
                value={tenantProfile.number}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, number: event.target.value })
                }
              />
            </label>
            <label>
              Bairro
              <input
                value={tenantProfile.neighborhood}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, neighborhood: event.target.value })
                }
              />
            </label>
            <label>
              Cidade
              <input
                value={tenantProfile.city}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, city: event.target.value })
                }
              />
            </label>
            <label>
              Estado
              <input
                maxLength={2}
                value={tenantProfile.state}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, state: event.target.value.toUpperCase() })
                }
              />
            </label>
            <label className={styles.wideField}>
              Complemento
              <input
                value={tenantProfile.complement}
                onChange={(event) =>
                  setTenantProfile({ ...tenantProfile, complement: event.target.value })
                }
              />
            </label>
          </div>
        )}

        <div className={styles.actionRow}>
          <button type="submit" disabled={tenantBusy || tenantLoading || !tenantProfile}>
            {tenantBusy ? 'Salvando...' : 'Salvar dados da empresa'}
          </button>
        </div>
      </form>

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
            className={styles.secondary}
            onClick={() => void handleVerify()}
            disabled={linkBusy || !startToken}
          >
            Verificar conexão
          </button>
          <button
            type="button"
            className={styles.secondary}
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
    </>
  );
}

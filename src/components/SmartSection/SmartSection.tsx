import { ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import styles from './SmartSection.module.css';

interface SmartSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  stickyWhenOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SmartSection({
  title,
  children,
  defaultOpen = false,
  stickyWhenOpen = false,
  isOpen,
  onToggle,
}: SmartSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const contentId = useId();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;

  useLayoutEffect(() => {
    if (open || !contentWrapperRef.current) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && contentWrapperRef.current.contains(activeElement)) {
      toggleButtonRef.current?.focus();
    }
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      if (onToggle) {
        onToggle();
        return;
      }
      setInternalOpen(true);
      return;
    }

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      contentWrapperRef.current?.contains(activeElement)
    ) {
      toggleButtonRef.current?.focus();
    }

    if (onToggle) {
      onToggle();
      return;
    }
    setInternalOpen(false);
  };

  return (
    <section
      className={`${styles.container} ${open ? styles.open : ''} ${
        stickyWhenOpen && open ? styles.stickyOpen : ''
      }`}
    >
      <div className={styles.header}>
        <h3>{title}</h3>
        <button
          type="button"
          ref={toggleButtonRef}
          className={styles.toggleButton}
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={`${open ? 'Fechar' : 'Abrir'} seção ${title}`}
        >
          <span className={styles.hamburger} aria-hidden="true">
            ☰
          </span>
        </button>
      </div>

      <div
        ref={contentWrapperRef}
        className={`${styles.contentWrapper} ${open ? styles.contentWrapperOpen : ''}`}
        aria-hidden={!open}
      >
        <div id={contentId} className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    </section>
  );
}

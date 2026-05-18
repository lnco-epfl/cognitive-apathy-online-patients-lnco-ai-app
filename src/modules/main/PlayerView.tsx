import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  AudioNarration,
  AudioNarrationControls,
} from 'jspsych-audio-narration';

import { PLAYER_VIEW_CY } from '@/config/selectors';

import { ExperimentLoader } from './ExperimentLoader';

const PlayerView = (): JSX.Element => {
  const { t } = useTranslation();
  const narration = useRef(new AudioNarration()).current;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 8);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    const ro = new ResizeObserver(updateScrollState);
    const mo = new MutationObserver((mutations) => {
      // jsPsych clears innerHTML between trials — detect it and reset to top
      const isTrialTransition = mutations.some(
        (m) =>
          m.removedNodes.length > 0 &&
          m.target instanceof Element &&
          m.target.childNodes.length === 0,
      );
      if (isTrialTransition && el) {
        el.scrollTop = 0;
      }
      updateScrollState();
    });
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      ro.observe(el);
      mo.observe(el, { childList: true, subtree: true });
      updateScrollState();
    }
    return () => {
      el?.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
      mo.disconnect();
    };
  }, [updateScrollState]);

  const scrollPage = (direction: 'up' | 'down'): void => {
    scrollRef.current?.scrollBy({
      top:
        direction === 'down'
          ? window.innerHeight * 0.6
          : -window.innerHeight * 0.6,
      behavior: 'smooth',
    });
  };
  return (
    <div data-cy={PLAYER_VIEW_CY} className="player-view">
      <div ref={scrollRef} className="player-scroll-container">
        <ExperimentLoader narration={narration} />
      </div>
      <AudioNarrationControls narration={narration} position="bottom-left" />
      {canScrollDown && (
        <button
          type="button"
          className="scroll-hint scroll-hint--down"
          onClick={() => scrollPage('down')}
          aria-label={t('SCROLL_DOWN')}
        >
          {t('SCROLL_DOWN')}
        </button>
      )}
      {canScrollUp && (
        <button
          type="button"
          className="scroll-hint scroll-hint--up"
          onClick={() => scrollPage('up')}
          aria-label={t('SCROLL_UP')}
        >
          {t('SCROLL_UP')}
        </button>
      )}{' '}
    </div>
  );
};
export default PlayerView;

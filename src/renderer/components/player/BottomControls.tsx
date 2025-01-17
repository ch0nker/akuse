import Store from 'electron-store';
import { useEffect, useRef, useState } from 'react';

import { formatTime } from '../../../modules/utils';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ButtonMain } from '../Buttons';
import { SkipEvent } from '../../../types/aniskipTypes';
const STORE = new Store();

interface BottomControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  currentTime?: number;
  duration?: number;
  buffered?: TimeRanges;
  skipEvents?: SkipEvent[];
  onClick?: (event: any) => void;
  onDblClick?: (event: any) => void;
}

const BottomControls: React.FC<BottomControlsProps> = ({
  videoRef,
  containerRef,
  currentTime,
  duration,
  buffered,
  skipEvents,
  onClick,
  onDblClick,
}) => {
  const videoTimelineRef = useRef<HTMLDivElement>(null);

  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const [videoCurrentTime, setVideoCurrentTime] = useState<string>('00:00');
  const [videoDuration, setVideoDuration] = useState<string>('00:00');
  const [remainingtime, setRemainingTime] = useState<string>('00:00');
  const [progressBarWidth, setProgressBarWidth] = useState<string>('0%');
  const [bufferedBarWidth, setBufferedBarWidth] = useState<string>('0%');

  const [offsetX, setOffsetX] = useState(0);
  const [percent, setPercent] = useState(0);

  const [introSkip, setIntroSkip] = useState<number>(
    STORE.get('intro_skip_time') as number,
  );
  const [showDuration, setShowDuration] = useState<boolean>(
    STORE.get('show_duration') as boolean,
  );
  useEffect(() => {
    setVideoCurrentTime(formatTime(videoRef.current?.currentTime ?? 0));
    setVideoDuration(formatTime(videoRef.current?.duration ?? 0));
    setProgressBarWidth('0%');
    setBufferedBarWidth('0%');
  }, []);

  useEffect(() => {
    setVideoCurrentTime(formatTime(currentTime ?? 0));
    setRemainingTime(formatTime((duration ?? 0) - (currentTime ?? 0)));
    setVideoDuration(formatTime(duration ?? 0));
    setProgressBarWidth(`${((currentTime ?? 0) / (duration ?? 0)) * 100}%`);

    if (videoRef.current && buffered && buffered.length > 0) {
      setBufferedBarWidth(`${(buffered.end(0) / (duration ?? 0)) * 100}%`);
    }
  }, [currentTime, duration, buffered]);

  useEffect(() => {
    window.addEventListener('mouseup', () => {
      setIsMouseDown(false);
    });
  });

  const handleShowDuration = () => {
    const show = !showDuration;

    STORE.set('show_duration', show);
    setShowDuration(show);
  };

  // Funzione per calcolare il tempo in base alla posizione sull'asse X
  const calculateProgressTime = (event: React.MouseEvent) => {
    if (!videoTimelineRef.current || !duration) return;
    let timelineWidth = videoTimelineRef.current.clientWidth;
    const newOffsetX = event.movementX > event.nativeEvent.offsetX ? event.movementX : event.nativeEvent.offsetX;

    let newPercent = Math.floor((newOffsetX / timelineWidth) * duration);
    if (newPercent < 0) newPercent = 0;
    if (newPercent > duration) newPercent = duration;
    const clampedOffsetX =
      newOffsetX < 20
        ? 20
        : newOffsetX > timelineWidth - 20
          ? timelineWidth - 20
          : newOffsetX;

    setOffsetX(clampedOffsetX);
    setPercent(newPercent);
  };

  const getTimePercent = (time: number) => {
    if(!videoRef.current) return 0;
    const video = videoRef.current;
    return (time / video.duration) * 100;
  }

  const getSkipEventBarStyle = (event: SkipEvent) => {
    const interval = event.interval;

    return {
      left: `${getTimePercent(interval.startTime)}%`,
      width: `${getTimePercent(interval.endTime - interval.startTime)}%`
    }
  }

  const dragProgressBar = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const timeline = event.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;

    const percentage = offsetX / timeline.clientWidth;

    let newTime = percentage * videoRef.current.duration;
    if (newTime < 0) newTime = 0;
    if (newTime > videoRef.current.duration) newTime = videoRef.current.duration;
    setProgressBarWidth(`${((newTime ?? 0) / (duration ?? 0)) * 100}%`);

    try {
      videoRef.current.currentTime = newTime;
    } catch (error) {
      console.log(error);
    }
  };

  const handleSkipIntro = () => {
    if (!videoRef.current) return;

    try {
      videoRef.current.currentTime += introSkip;
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <div
      className="bottom-controls"
      onClick={onClick}
      onDoubleClick={onDblClick}
    >
      {/* {showSkipEvent && skipEvents && skipEvents.length > 0 && (
      <div
        className="skip-button"
        style={{opacity: '1', zIndex: '900'}}
      >
        <ButtonMain
          text={skipEvent}
          icon={faFastForward}
          tint="light"
          onClick={handleSkipIntro}
        />
      </div>
      )} */}
      <div className="skip-button">
        <ButtonMain
          text={introSkip}
          icon={faPlus}
          tint="light"
          onClick={handleSkipIntro}
        />
      </div>
      <p className="current-time">{videoCurrentTime}</p>
      <div
        className="video-timeline"
        onClick={dragProgressBar}
        onMouseMove={(event) => {
          const target = event.target as HTMLDivElement;
          if(target.className === 'video-event-bar') {
            const parentElement = target.parentElement as HTMLDivElement;
            const parentDimensions = parentElement.getBoundingClientRect();
            const eventDimensions = target.getBoundingClientRect();

            /* lol this is a bit hacky replacing movementX but it works */
            event.movementX = Math.floor(eventDimensions.x - parentDimensions.x) + event.nativeEvent.offsetX;
            event.clientX = Math.floor(eventDimensions.x + event.nativeEvent.offsetX)
            event.currentTarget = parentElement as HTMLDivElement;
          }
          calculateProgressTime(event);
          if (!isMouseDown) return;
          dragProgressBar(event);
        }}
        onMouseDown={() => setIsMouseDown(true)}
        onMouseUp={() => setIsMouseDown(false)}
        ref={videoTimelineRef}
      >
        <div className="progress-area">
          <div
            className="video-buffered-bar"
            style={{ width: bufferedBarWidth }}
          ></div>
          {(skipEvents ?? []).map((event) => (
            <div
              className="video-event-bar"
              style={getSkipEventBarStyle(event)}
            ></div>
          ))}
          <div
            className="video-progress-bar"
            style={{ width: progressBarWidth }}
          ></div>
          {/* <div className="preview-thumbnail">
            <img src={previewThumbnailSrc} alt="preview" />
            <div className="time">
              <span>{videoCurrentTime}</span>
              </div>
            </div> */}
          <span style={{ left: `${offsetX}px` }}>{formatTime(percent)}</span>
        </div>
      </div>
      <p
        className="video-duration"
        onClick={handleShowDuration}
        style={{ marginLeft: showDuration ? 8 : '' }}
      >
        {showDuration ? videoDuration : `-${remainingtime}`}
      </p>
    </div>
  );
};

export default BottomControls;

import { useCallback, useEffect, useRef, useState } from "react";
import A1TutorialScreen from "./components/A1TutorialScreen";
import Calculator from "./components/Calculator";
import CompletionScreen from "./components/CompletionScreen";
import IntroScreen from "./components/IntroScreen";
import LandingScreen from "./components/LandingScreen";
import LevelUpNotice from "./components/LevelUpNotice";
import MapScreen from "./components/MapScreen";
import PlayerProfileForm from "./components/PlayerProfileForm";
import QuestionScreen from "./components/QuestionScreen";
import { A0_TUTORIAL, getStageA, nextStageA } from "./game/definitions/stages";
import { GameAudio } from "./game/audio";
import { getPromotionForCompletion, type CareerLevel } from "./game/logic/career";
import { completeStage } from "./game/logic/progression";
import type { PlayerAvatarId } from "./game/logic/playerProfile";
import { createRandom } from "./game/logic/random";
import { generateStageQuestion } from "./game/logic/questions";
import { scoreA1Answer } from "./game/logic/scoring";
import { performancePointsEarned } from "./game/logic/speed";
import LifestyleScreen from "./systems/lifestyle-shop/LifestyleScreen";
import {
  displayLifestyleItem,
  purchaseLifestyleItem,
} from "./systems/lifestyle-shop/economy";
import type { CalculatorState } from "./game/logic/calculator";
import {
  createNewGame,
  loadGame,
  saveGame,
  type GameSave,
  type LivePhase,
} from "./progress/persistence/gameSave";
import "./styles/global.css";

type InitialLoad =
  | { save: GameSave; error: null; hasSavedGame: boolean }
  | { save: null; error: string; hasSavedGame: false };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected browser storage error occurred.";
}

function loadInitial(): InitialLoad {
  try {
    const loaded = loadGame();
    if (!loaded) {
      return {
        save: { ...createNewGame(), phase: "menu", resumePhase: null },
        error: null,
        hasSavedGame: false,
      };
    }
    const resumePhase =
      loaded.phase === "menu" ? loaded.resumePhase : loaded.phase;
    return {
      save: { ...loaded, phase: "menu", resumePhase },
      error: null,
      hasSavedGame: true,
    };
  } catch (error) {
    return { save: null, error: errorMessage(error), hasSavedGame: false };
  }
}

function App() {
  const [initialLoad] = useState(loadInitial);
  const [game, setGame] = useState<GameSave | null>(initialLoad.save);
  const gameRef = useRef<GameSave | null>(initialLoad.save);
  const [hasSavedGame, setHasSavedGame] = useState(initialLoad.hasSavedGame);
  const [storageError, setStorageError] = useState(initialLoad.error);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [calculatorDemoState, setCalculatorDemoState] = useState<CalculatorState | null>(null);
  const [calculatorDemoActiveButton, setCalculatorDemoActiveButton] = useState<string | null>(null);
  const [calculatorDemoHint, setCalculatorDemoHint] = useState<string | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [continueAfterProfile, setContinueAfterProfile] = useState(false);
  const [promotionLevel, setPromotionLevel] = useState<CareerLevel | null>(null);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const questionStartedAt = useRef(0);
  const audioRef = useRef<GameAudio | null>(null);
  const lastQuestionCue = useRef<string | null>(null);

  useEffect(() => {
    audioRef.current = new GameAudio(
      gameRef.current?.audioMuted ?? false,
      setAudioError,
    );
  }, []);

  const updateGame = useCallback(
    (update: (current: GameSave) => GameSave, persist = true) => {
      const current = gameRef.current;
      if (!current) return;
      const next = update(current);
      gameRef.current = next;
      setGame(next);
      if (persist) {
        try {
          saveGame(next);
          setStorageError(null);
          setHasSavedGame(true);
        } catch (error) {
          setStorageError(`Progress could not be saved: ${errorMessage(error)}`);
        }
      }
    },
    [],
  );

  const startQuestion = useCallback(
    (current: GameSave): GameSave => {
      const serial = current.itemSerial + 1;
      const question = generateStageQuestion(
        current.currentStageId,
        createRandom(current.randomSeed + serial),
        serial,
        current.questionNumber + 1,
      );
      questionStartedAt.current = Date.now();
      return {
        ...current,
        phase: "question",
        resumePhase: "question",
        question,
        itemSerial: serial,
        elapsedMs: 0,
        answer: null,
        answerCorrect: null,
        questionPerformancePoints: 0,
        feedback: [],
        tutorialReturnPhase: null,
      };
    },
    [],
  );

  const enterQuestion = useCallback(
    (current: GameSave): GameSave => {
      if (current.question) {
        questionStartedAt.current = Date.now();
        return {
          ...current,
          phase: "question",
          resumePhase: "question",
          tutorialReturnPhase: null,
        };
      }
      return startQuestion(current);
    },
    [startQuestion],
  );

  const beginNewGame = useCallback((name: string, avatarId: PlayerAvatarId) => {
    audioRef.current?.startMusic();
    questionStartedAt.current = 0;
    setPauseOpen(false);
    setCalculatorVisible(false);
    setConfirmNewGame(false);
    setCreatingProfile(false);
    setContinueAfterProfile(false);
    updateGame(() => ({
      ...createNewGame(),
      playerName: name,
      playerAvatarId: avatarId,
      profileCreated: true,
    }));
  }, [updateGame]);

  const resumeGame = useCallback(() => {
    audioRef.current?.startMusic();
    const current = gameRef.current;
    if (!current) return;
    const phase: LivePhase =
      current.resumePhase === "map"
        ? "map"
        : current.resumePhase === "lifestyle"
          ? "lifestyle"
          : current.questionNumber >= 8
        ? "summary"
        : current.resumePhase === "a1-tutorial"
          ? "a1-tutorial"
        : current.answer !== null
          ? "feedback"
          : current.resumePhase ??
            (current.introSeen
              ? current.tutorialsSeenStages.includes(current.currentStageId)
                ? "question"
                : "a1-tutorial"
              : "intro");
    questionStartedAt.current = phase === "question" ? Date.now() : 0;
    setPauseOpen(false);
    setCalculatorVisible(false);
    updateGame((state) => ({ ...state, phase }));
  }, [updateGame]);

  const elapsedNow = useCallback((current: GameSave): number => {
    if (current.phase !== "question" || pauseOpen || profileOpen || !questionStartedAt.current) {
      return current.elapsedMs;
    }
    return current.elapsedMs + Math.max(0, Date.now() - questionStartedAt.current);
  }, [pauseOpen, profileOpen]);

  useEffect(() => {
    if (!game || game.phase !== "question" || pauseOpen || profileOpen) return;
    if (!questionStartedAt.current) questionStartedAt.current = Date.now();
    let lastSave = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      if (now - lastSave < 1000) return;
      lastSave = now;
      const current = gameRef.current;
      if (!current || current.phase !== "question") return;
      const elapsedMs =
        current.elapsedMs + Math.max(0, now - questionStartedAt.current);
      questionStartedAt.current = now;
      const next = { ...current, elapsedMs };
      gameRef.current = next;
      setGame(next);
      try {
        saveGame(next);
        setStorageError(null);
      } catch (error) {
        setStorageError(`Progress could not be saved: ${errorMessage(error)}`);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [game?.phase, pauseOpen, profileOpen]);

  const openProfileEditor = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    if (current.phase === "question" && !pauseOpen) {
      const elapsedMs = elapsedNow(current);
      questionStartedAt.current = 0;
      updateGame((state) => ({ ...state, elapsedMs }));
    }
    setProfileOpen(true);
  }, [elapsedNow, pauseOpen, updateGame]);

  const closeProfileEditor = useCallback(() => {
    const current = gameRef.current;
    if (current?.phase === "question" && !pauseOpen) {
      questionStartedAt.current = Date.now();
    }
    setProfileOpen(false);
  }, [pauseOpen]);

  const saveProfile = useCallback((name: string, avatarId: PlayerAvatarId) => {
    updateGame((current) => ({
      ...current,
      playerName: name,
      playerAvatarId: avatarId,
      profileCreated: true,
    }));
    setProfileOpen(false);
  }, [updateGame]);

  const completeProfileSetup = useCallback((name: string, avatarId: PlayerAvatarId) => {
    if (!continueAfterProfile) {
      beginNewGame(name, avatarId);
      return;
    }
    updateGame((current) => ({
      ...current,
      playerName: name,
      playerAvatarId: avatarId,
      profileCreated: true,
    }));
    setCreatingProfile(false);
    setContinueAfterProfile(false);
    resumeGame();
  }, [beginNewGame, continueAfterProfile, resumeGame, updateGame]);

  useEffect(() => {
    if (!game || game.phase !== "question" || !game.question) return;
    if (lastQuestionCue.current === game.question.id) return;
    lastQuestionCue.current = game.question.id;
    audioRef.current?.effect("question_start");
  }, [game?.phase, game?.question?.id]);

  const toggleAudio = useCallback(() => {
    const audioMuted = !(gameRef.current?.audioMuted ?? false);
    audioRef.current?.setMuted(audioMuted);
    updateGame((current) => ({ ...current, audioMuted }));
  }, [updateGame]);

  const toggleCalculator = useCallback(() => {
    setCalculatorVisible((visible) => !visible);
  }, []);

  const updateCalculatorDemo = useCallback(
    (
      visible: boolean,
      state: CalculatorState | null,
      activeButton: string | null,
      hint: string | null,
    ) => {
      setCalculatorVisible(visible);
      setCalculatorDemoState(state);
      setCalculatorDemoActiveButton(activeButton);
      setCalculatorDemoHint(hint);
    },
    [],
  );

  const closeCalculator = useCallback(() => {
    const current = gameRef.current;
    if (
      calculatorDemoState &&
      current?.phase === "a1-tutorial" &&
      current.currentStageId === "A4"
    ) return;
    setCalculatorVisible(false);
  }, [calculatorDemoState]);

  const openTutorial = useCallback(() => {
    const current = gameRef.current;
    if (!current || !current.question) return;
    const elapsedMs = elapsedNow(current);
    questionStartedAt.current = 0;
    setCalculatorVisible(false);
    updateGame((state) => ({
      ...state,
      phase: "a1-tutorial",
      resumePhase: "a1-tutorial",
      tutorialReturnPhase: current.phase === "feedback" ? "feedback" : "question",
      elapsedMs,
    }));
  }, [elapsedNow, updateGame]);

  const closeIntro = useCallback(() => {
    questionStartedAt.current = 0;
    updateGame((current) => ({
      ...current,
      introSeen: true,
      introIndex: A0_TUTORIAL.length - 1,
      phase: "a1-tutorial",
      resumePhase: "a1-tutorial",
    }));
  }, [updateGame]);

  const advanceIntro = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    if (current.introIndex >= A0_TUTORIAL.length - 1) {
      closeIntro();
      return;
    }
    updateGame((state) => ({
      ...state,
      introIndex: state.introIndex + 1,
    }));
  }, [closeIntro, updateGame]);

  const closeTutorial = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    if (
      (current.tutorialReturnPhase === "question" ||
        current.tutorialReturnPhase === "feedback") &&
      current.question
    ) {
      const returnPhase = current.tutorialReturnPhase;
      questionStartedAt.current = returnPhase === "question" ? Date.now() : 0;
      updateGame((state) => ({
        ...state,
        tutorialSeen: true,
        tutorialsSeenStages: state.tutorialsSeenStages.includes(state.currentStageId)
          ? state.tutorialsSeenStages
          : [...state.tutorialsSeenStages, state.currentStageId],
        phase: returnPhase,
        resumePhase: returnPhase,
        tutorialReturnPhase: null,
      }));
      return;
    }
    updateGame((state) =>
      enterQuestion({
        ...state,
        tutorialSeen: state.currentStageId === "A1" ? true : state.tutorialSeen,
        tutorialsSeenStages: state.tutorialsSeenStages.includes(state.currentStageId)
          ? state.tutorialsSeenStages
          : [...state.tutorialsSeenStages, state.currentStageId],
      }),
    );
  }, [enterQuestion, updateGame]);

  const answerQuestion = useCallback((answer: string) => {
    const current = gameRef.current;
    if (
      !current ||
      current.phase !== "question" ||
      !current.question ||
      current.answer !== null
    ) {
      return;
    }
    const result = scoreA1Answer(current.question, answer);
    const elapsedMs = elapsedNow(current);
    const earnedPoints = performancePointsEarned(
      elapsedMs / 1000,
      result.outcome === "correct",
      getStageA(current.currentStageId).timeFactor,
    );
    const questionNumber = current.questionNumber + 1;
    const correctAnswers =
      current.correctAnswers + (result.outcome === "correct" ? 1 : 0);
    let newlyAchievedLevel: CareerLevel | null = null;
    if (questionNumber === 8) {
      newlyAchievedLevel = getPromotionForCompletion(
        current.completedStages,
        current.currentStageId,
      );
    }
    const feedback =
      result.outcome === "correct"
        ? [`Correct — ${current.question.correctAnswer}.`, current.question.explanation]
        : [
            `Not quite — the answer is ${current.question.correctAnswer}.`,
            current.question.explanation,
          ];
    questionStartedAt.current = 0;
    if (result.outcome === "correct") audioRef.current?.effect("correct");
    else audioRef.current?.effect("wrong");

    updateGame((state) => {
      const base: GameSave = {
        ...state,
        questionNumber,
        correctAnswers,
        streak: result.outcome === "correct" ? state.streak + 1 : 0,
        performancePoints: state.performancePoints + earnedPoints,
        stagePerformancePoints: state.stagePerformancePoints + earnedPoints,
        elapsedMs,
        answer,
        answerCorrect: result.outcome === "correct",
        questionPerformancePoints: earnedPoints,
        feedback,
      };
      if (questionNumber < 8) {
        return { ...base, phase: "feedback", resumePhase: "feedback" };
      }
      const stageId = state.currentStageId;
      const alreadyCredited = state.cashCreditedStages.includes(stageId);
      const completion = completeStage(
        stageId,
        correctAnswers,
        state.stagePerformancePoints + earnedPoints,
        alreadyCredited,
      );
      const cashCreditedStages = alreadyCredited
        ? state.cashCreditedStages
        : [...state.cashCreditedStages, stageId];
      return {
        ...base,
        phase: "summary",
        resumePhase: "summary",
        careerEarnings: state.careerEarnings + completion.cashCredited,
        availableCash: state.availableCash + completion.cashCredited,
        stageEarnings: completion.earnings,
        cashCreditedStages,
        completedStages: state.completedStages.includes(stageId)
          ? state.completedStages
          : [...state.completedStages, stageId],
        result: completion,
      };
    });
    if (newlyAchievedLevel) setPromotionLevel(newlyAchievedLevel);
  }, [elapsedNow, updateGame]);

  const nextQuestion = useCallback(() => {
    updateGame((current) => startQuestion(current));
  }, [startQuestion, updateGame]);

  const advanceStage = useCallback(() => {
    const current = gameRef.current;
    if (
      !current ||
      (current.phase !== "summary" && current.phase !== "map") ||
      !current.completedStages.includes(current.currentStageId)
    ) return;
    const nextStageId = nextStageA(current.currentStageId);
    if (!nextStageId || !current.completedStages.includes(current.currentStageId)) return;
    questionStartedAt.current = 0;
    updateGame((state) => ({
      ...state,
      currentStageId: nextStageId,
      phase: "a1-tutorial",
      resumePhase: "a1-tutorial",
      question: null,
      questionNumber: 0,
      correctAnswers: 0,
      streak: 0,
      stageEarnings: 0,
      elapsedMs: 0,
      answer: null,
      answerCorrect: null,
      questionPerformancePoints: 0,
      stagePerformancePoints: 0,
      feedback: [],
      result: null,
      tutorialReturnPhase: null,
    }));
  }, [updateGame]);

  const openMap = useCallback(() => {
    questionStartedAt.current = 0;
    setCalculatorVisible(false);
    setPauseOpen(false);
    updateGame((current) => ({ ...current, phase: "map", resumePhase: "map" }));
  }, [updateGame]);

  const openLifestyle = useCallback(() => {
    questionStartedAt.current = 0;
    setCalculatorVisible(false);
    setPauseOpen(false);
    updateGame((current) => ({ ...current, phase: "lifestyle", resumePhase: "lifestyle" }));
  }, [updateGame]);

  const commitLifestyleChange = useCallback(
    (change: (current: GameSave) => GameSave | null) => {
      const current = gameRef.current;
      if (!current) return;
      const next = change(current);
      if (!next || next === current) return;
      try {
        saveGame(next);
        gameRef.current = next;
        setGame(next);
        setHasSavedGame(true);
        setStorageError(null);
      } catch (error) {
        setStorageError(`Lifestyle change could not be saved: ${errorMessage(error)}`);
      }
    },
    [],
  );

  const purchaseLifestyleProduct = useCallback(
    (productId: string) => commitLifestyleChange((current) => purchaseLifestyleItem(current, productId)),
    [commitLifestyleChange],
  );

  const displayLifestyleProduct = useCallback(
    (productId: string) => commitLifestyleChange((current) => displayLifestyleItem(current, productId)),
    [commitLifestyleChange],
  );

  const resumeFromMap = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    if (current.completedStages.includes(current.currentStageId)) {
      advanceStage();
      return;
    }
    const phase: LivePhase =
      current.questionNumber >= 8
        ? "summary"
        : current.answer !== null
          ? "feedback"
          : current.question
            ? "question"
            : current.introSeen
              ? current.tutorialsSeenStages.includes(current.currentStageId)
                ? "question"
                : "a1-tutorial"
              : "intro";
    questionStartedAt.current = phase === "question" ? Date.now() : 0;
    updateGame((state) => ({ ...state, phase, resumePhase: phase }));
  }, [advanceStage, updateGame]);

  const pauseGame = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    const elapsedMs = elapsedNow(current);
    questionStartedAt.current = 0;
    updateGame((state) => ({ ...state, elapsedMs }));
    setPauseOpen(true);
  }, [elapsedNow, updateGame]);

  const openMenu = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    const elapsedMs = elapsedNow(current);
    questionStartedAt.current = 0;
    setCalculatorVisible(false);
    setPauseOpen(false);
    updateGame((state) => ({
      ...state,
      phase: "menu",
      resumePhase: state.phase === "menu" ? state.resumePhase : state.phase,
      elapsedMs,
    }));
  }, [elapsedNow, updateGame]);

  const resumeFromPause = useCallback(() => {
    questionStartedAt.current = Date.now();
    setPauseOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = gameRef.current;
      if (!current || calculatorVisible) return;
      if (profileOpen) {
        if (event.key === "Escape") closeProfileEditor();
        return;
      }
      if (promotionLevel && event.key === "Escape") {
        setPromotionLevel(null);
        return;
      }
      if (
        event.key.toLowerCase() === "c" &&
        ["question", "feedback", "a1-tutorial", "intro"].includes(current.phase)
      ) {
        event.preventDefault();
        toggleCalculator();
        return;
      }
      if (event.key === "Escape") {
        if (pauseOpen) resumeFromPause();
        else if (current.phase === "question" || current.phase === "feedback") pauseGame();
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        if (current.phase === "feedback") {
          event.preventDefault();
          if (current.questionNumber < 8) nextQuestion();
        }
        return;
      }
      if (current.phase === "question" && /^[1-3]$/.test(event.key)) {
        event.preventDefault();
        const choice = current.question?.choices[Number(event.key) - 1];
        if (choice) answerQuestion(choice);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerQuestion, calculatorVisible, closeProfileEditor, nextQuestion, pauseGame, pauseOpen, profileOpen, promotionLevel, resumeFromPause, toggleCalculator]);

  if (!game) {
    return (
      <main className="storage-failure">
        <h1>Unable to load saved progress</h1>
        <p>{storageError}</p>
        <p>Your save was not changed. Reload after resolving the browser storage issue.</p>
      </main>
    );
  }

  if (creatingProfile) {
    return (
      <div className="app-shell">
        <PlayerProfileForm
          initialAvatarId={game.playerAvatarId}
          initialName={game.playerName}
          mode="create"
          onCancel={() => {
            setCreatingProfile(false);
            setContinueAfterProfile(false);
          }}
          onSave={completeProfileSetup}
        />
        {storageError && <div className="app-notice storage-notice" role="alert">{storageError}</div>}
      </div>
    );
  }

  const elapsedMs = game.phase === "question" && !pauseOpen && questionStartedAt.current
    ? game.elapsedMs + Math.max(0, clockNow - questionStartedAt.current)
    : game.elapsedMs;
  const timerQuestionNumber = game.phase === "question"
    ? game.questionNumber + 1
    : Math.min(game.questionNumber, 8);

  return (
    <div className="app-shell">
      {game.phase === "menu" && (
        <LandingScreen
          hasSavedGame={hasSavedGame}
          confirmNewGame={confirmNewGame}
          onCancelNewGame={() => setConfirmNewGame(false)}
          onConfirmNewGame={() => {
            setConfirmNewGame(false);
            setCreatingProfile(true);
          }}
          onContinue={() => {
            if (game.profileCreated) {
              resumeGame();
            } else {
              setContinueAfterProfile(true);
              setCreatingProfile(true);
            }
          }}
          onNewGame={() => {
            if (hasSavedGame) {
              setConfirmNewGame(true);
            } else {
              setCreatingProfile(true);
            }
          }}
          onOpenMap={openMap}
          onOpenLifestyle={openLifestyle}
        />
      )}
      {game.phase === "map" && (
        <MapScreen
          save={game}
          onContinue={resumeFromMap}
          onLifestyle={openLifestyle}
          onMenu={openMenu}
        />
      )}
      {game.phase === "lifestyle" && (
        <LifestyleScreen
          save={game}
          onBackToMap={openMap}
          onDisplay={displayLifestyleProduct}
          onEditProfile={openProfileEditor}
          profileEditing={profileOpen}
          onPurchase={purchaseLifestyleProduct}
        />
      )}
      {game.phase === "intro" && (
        <IntroScreen
          chunk={A0_TUTORIAL[game.introIndex]!}
          index={game.introIndex}
          onAdvance={advanceIntro}
          onSkip={closeIntro}
          onTypeTick={() => audioRef.current?.effect("type_tick")}
          onCalculatorVisibility={setCalculatorVisible}
          onCalculatorDemoState={setCalculatorDemoState}
        />
      )}
      {game.phase === "a1-tutorial" && (
        <A1TutorialScreen
          stageId={game.currentStageId}
          onContinue={closeTutorial}
          onTypeTick={() => audioRef.current?.effect("type_tick")}
          onCalculatorDemo={updateCalculatorDemo}
        />
      )}
      {(game.phase === "question" || game.phase === "feedback") && game.question && (
        <QuestionScreen
          answered={game.phase === "feedback"}
          audioMuted={game.audioMuted}
          answeredQuestions={game.questionNumber}
          availableCash={game.availableCash}
          completedStages={game.completedStages}
          elapsedMs={elapsedMs}
          feedback={game.feedback}
          questionPerformancePoints={game.questionPerformancePoints}
          onAnswer={answerQuestion}
          onCalculator={toggleCalculator}
          onContinue={nextQuestion}
          onMenu={pauseGame}
          onEditProfile={openProfileEditor}
          onToggleAudio={toggleAudio}
          onTutorial={openTutorial}
          question={game.question}
          questionNumber={timerQuestionNumber}
          playerAvatarId={game.playerAvatarId}
          playerName={game.playerName}
          streak={game.streak}
        />
      )}
      {game.phase === "summary" && game.result && (
        <CompletionScreen
          availableCash={game.availableCash}
          careerEarnings={game.careerEarnings}
          completedStages={game.completedStages}
          onLifestyle={openLifestyle}
          onMap={openMap}
          result={game.result}
          stage={getStageA(game.currentStageId)}
        />
      )}
      {pauseOpen && (
        <div className="pause-backdrop">
          <section className="pause-card" aria-labelledby="pause-title" role="dialog">
            <div className="lesson-kicker">GAME MENU</div>
            <h2 id="pause-title">Paused</h2>
            <button className="primary-button" onClick={resumeFromPause} type="button">RESUME</button>
            <button className="secondary-button" onClick={openMenu} type="button">MAIN MENU</button>
            <p>Esc to resume</p>
          </section>
        </div>
      )}
      <Calculator
        onClose={closeCalculator}
        onEscape={closeCalculator}
        demoState={calculatorDemoState}
        demoActiveButton={calculatorDemoActiveButton}
        demoHint={calculatorDemoHint}
        preventDemoClose={
          game.phase === "a1-tutorial" &&
          game.currentStageId === "A4" &&
          calculatorDemoState !== null
        }
        visible={calculatorVisible}
      />
      {storageError && (
        <div className="app-notice storage-notice" role="alert">{storageError}</div>
      )}
      {audioError && (
        <div className="app-notice audio-notice" role="status">
          {audioError}
          <button onClick={() => setAudioError(null)} type="button">Dismiss</button>
        </div>
      )}
      {profileOpen && (
        <PlayerProfileForm
          initialAvatarId={game.playerAvatarId}
          initialName={game.playerName}
          mode="edit"
          onCancel={closeProfileEditor}
          onSave={saveProfile}
        />
      )}
      {promotionLevel && (
        <LevelUpNotice
          avatarId={game.playerAvatarId}
          level={promotionLevel}
          onContinue={() => setPromotionLevel(null)}
        />
      )}
    </div>
  );
}

export default App;

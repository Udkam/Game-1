import { Enter, Exit, type SimulationCommand } from "../core/commands";
import { createSimulationSession, type SimulationSession } from "../core/history";
import { createStage3BSimulationState } from "../core/worldGraph";
import { AudioManager } from "../audio/AudioManager";
import { createProjectionFromSimulationState } from "../projection/simulationProjection";
import { PixiApp } from "../render/PixiApp";
import { EventPipeline } from "./EventPipeline";
import { InteractionPrototype } from "./InteractionPrototype";

export class GameRuntime {
  private readonly host: HTMLElement;
  private readonly pipeline = new EventPipeline();
  private readonly audioManager = new AudioManager();
  private pixiApp: PixiApp | null = null;
  private interactionPrototype: InteractionPrototype | null = null;
  private session: SimulationSession = createSimulationSession(createStage3BSimulationState());
  private readonly queuedCommands: SimulationCommand[] = [];
  private destroyed = false;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  async start() {
    const pixiApp = new PixiApp(this.host);
    await pixiApp.init();

    if (this.destroyed) {
      pixiApp.destroy();
      return;
    }

    this.pixiApp = pixiApp;
    this.pixiApp.render(createProjectionFromSimulationState(this.session.present));
    this.interactionPrototype = new InteractionPrototype({
      onCommand: (command) => this.enqueueOrDispatch(command),
      getRecursiveCommand: () => this.getRecursiveCommand(),
    });
    this.interactionPrototype.start();
  }

  destroy() {
    this.destroyed = true;

    this.interactionPrototype?.destroy();
    this.pixiApp?.destroy();
    this.interactionPrototype = null;
    this.pixiApp = null;
    this.queuedCommands.length = 0;
  }

  private enqueueOrDispatch(command: SimulationCommand) {
    if (!this.pixiApp) {
      return;
    }

    if (this.pixiApp.isAnimating) {
      this.queuedCommands.push(command);
      return;
    }

    this.dispatch(command);
  }

  private dispatch(command: SimulationCommand) {
    const pixiApp = this.pixiApp;
    if (!pixiApp) {
      return;
    }

    const result = this.pipeline.dispatch(this.session, command);
    this.session = result.session;
    this.audioManager.playAll(result.animationPlan.audioCues);
    pixiApp.renderWithAnimation(result.previousProjection, result.nextProjection, result.animationPlan, () => {
      this.flushQueuedCommand();
    });
  }

  private flushQueuedCommand() {
    if (this.destroyed || !this.pixiApp || this.pixiApp.isAnimating) {
      return;
    }

    const nextCommand = this.queuedCommands.shift();
    if (nextCommand) {
      this.dispatch(nextCommand);
    }
  }

  private getRecursiveCommand(): SimulationCommand {
    return this.session.present.focusPath.length === 0 ? Enter("container-b") : Exit("container-b");
  }
}

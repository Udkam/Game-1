import { Enter, Exit, Move, Redo, Reset, Undo, type SimulationCommand } from "../core/commands";

export interface InteractionPrototypeOptions {
  onCommand: (command: SimulationCommand) => void;
  getRecursiveCommand: () => SimulationCommand;
}

export class InteractionPrototype {
  private enabled = false;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const command = commandFromKeyboardEvent(event, this.options.getRecursiveCommand);
    if (!command) {
      return;
    }

    event.preventDefault();
    this.options.onCommand(command);
  };

  constructor(private readonly options: InteractionPrototypeOptions) {}

  start() {
    if (this.enabled) {
      return;
    }

    window.addEventListener("keydown", this.handleKeyDown);
    this.enabled = true;
  }

  destroy() {
    if (!this.enabled) {
      return;
    }

    window.removeEventListener("keydown", this.handleKeyDown);
    this.enabled = false;
  }
}

export function commandFromKeyboardEvent(
  event: Pick<KeyboardEvent, "key" | "shiftKey">,
  getRecursiveCommand: () => SimulationCommand = () => Enter("container-b"),
): SimulationCommand | null {
  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") {
    return Move("up");
  }
  if (key === "arrowdown" || key === "s") {
    return Move("down");
  }
  if (key === "arrowleft" || key === "a") {
    return Move("left");
  }
  if (key === "arrowright" || key === "d") {
    return Move("right");
  }
  if (key === "z") {
    return event.shiftKey ? Redo() : Undo();
  }
  if (key === "backspace") {
    return Undo();
  }
  if (key === "y") {
    return Redo();
  }
  if (key === "r") {
    return Reset();
  }
  if (key === "e") {
    return getRecursiveCommand();
  }

  return null;
}

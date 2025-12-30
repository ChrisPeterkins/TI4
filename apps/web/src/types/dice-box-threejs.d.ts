declare module '@3d-dice/dice-box-threejs' {
  interface DiceBoxConfig {
    framerate?: number;
    sounds?: boolean;
    volume?: number;
    color_spotlight?: number;
    shadows?: boolean;
    theme_surface?: string;
    sound_dieMaterial?: string;
    theme_colorset?: string;
    theme_texture?: string;
    theme_material?: 'none' | 'metal' | 'wood' | 'glass' | 'plastic';
    gravity_multiplier?: number;
    light_intensity?: number;
    baseScale?: number;
    strength?: number;
    onRollComplete?: (results: DiceResult[]) => void;
  }

  interface DiceResult {
    groupId: number;
    rollId: number;
    sides: number;
    theme: string;
    themeColor: string;
    value: number;
  }

  class DiceBox {
    constructor(selector: string, config?: DiceBoxConfig);
    initialize(): Promise<void>;
    roll(notation: string): Promise<DiceResult[]>;
    clear(): void;
    updateConfig(config: Partial<DiceBoxConfig>): void;
  }

  export default DiceBox;
}

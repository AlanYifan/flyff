/**
 * 自动战斗相关类型定义
 * 为自动战斗系统提供完整的类型支持
 */

export interface AutoBattleConfig {
  targetSelection: 'random' | 'weakest' | 'strongest' | 'nearest' | 'highestExp' | 'lowestDefense';
  baseAttackInterval: number;
  minAttackInterval: number;
  maxAttackInterval: number;
  skillCheckInterval: number;
  healthThreshold: number;
  manaThreshold: number;
  autoUseSkills: boolean;
  skillSelectionStrategy: 'priority' | 'highestDamage' | 'lowestMana' | 'efficiency';
  monsterMinLevel: number;
  monsterMaxLevel: number;
  monsterDisplayCount: number;
  monsterRefreshStrategy: 'countdown' | 'immediate' | 'manual';
  autoUseRecoveryItems: boolean;
  recoveryThreshold: number;
}

export interface AutoBattleStats {
  totalAttacks: number;
  totalDamage: number;
  monstersDefeated: number;
  skillsUsed: number;
  startTime: number | null;
  endTime: number | null;
  lastAttackTime: number | null;
  duration: number;
  averageDamage: number;
  attacksPerSecond: string;
  damagePerSecond: number;
}

export interface Player {
  id: string;
  name: string;
  level: number;
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
  exp: number;
  maxExp: number;
  gold: number;
  attackSpeed: number;
  hitRate: number;
  critRate: number;
  critDamage: number;
  minAttack: number;
  maxAttack: number;
  yoyoAttack: number;
  bowAttack: number;
  job: string;
  className: string;
  equipment: PlayerEquipment;
  tempStats: PlayerTempStats;
  isAttacking: boolean;
  lastAttackStartTime: number | null;
}

export interface PlayerEquipment {
  weapon: EquipmentItem | null;
  armor: EquipmentItem | null;
  helmet: EquipmentItem | null;
  gloves: EquipmentItem | null;
  boots: EquipmentItem | null;
  ring1: EquipmentItem | null;
  ring2: EquipmentItem | null;
  necklace: EquipmentItem | null;
  earrings1: EquipmentItem | null;
  earrings2: EquipmentItem | null;
  cape: EquipmentItem | null;
  shield: EquipmentItem | null;
}

export interface PlayerTempStats {
  attack: number;
  yoyoAttack: number;
  bowAttack: number;
  defense: number;
  magicDefense: number;
}

export interface EquipmentItem {
  id: number;
  name: string;
  icon: string;
  subcategory: string;
  elementType?: string;
  stats?: EquipmentStats;
}

export interface EquipmentStats {
  attack?: number;
  defense?: number;
  magicAttack?: number;
  magicDefense?: number;
  critRate?: number;
  hitRate?: number;
}

export interface Monster {
  id: number;
  name: string | { cns: string; eng: string };
  level: number;
  monsterLevel?: number;
  hp: number;
  health?: number;
  currentHealth: number;
  maxHealth: number;
  defense: number;
  attack: number;
  attackSpeed: number;
  hitRate: number;
  critRate: number;
  exp: number;
  drops: MonsterDrop[];
  icon: string;
  monsterIcon?: string;
  weakness?: string[];
  isDefeated: boolean;
  area: string;
  event?: boolean;
}

export interface MonsterDrop {
  id: number;
  type: 'item' | 'gold' | 'exp';
  itemId?: number;
  name?: string;
  icon?: string;
  quantity?: number;
  rate?: number;
}

export interface Skill {
  id: number;
  key: string;
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff';
  category?: string;
  level: number;
  damage?: number;
  manaCost: number;
  cooldown: number;
  currentCooldown: number;
  unlockLevel?: number;
  requiredJob?: string;
  isLocked: boolean;
  icon?: string;
  description?: string;
}

export interface AutoBattleService {
  initialize(options: AutoBattleServiceOptions): void;
  start(): boolean;
  stop(): boolean;
  pause(): boolean;
  resume(): boolean;
  toggle(): boolean;
  updateMonsters(monsters: Monster[], preserveDefeatedState?: boolean): void;
  updateConfig(config: Partial<AutoBattleConfig>): void;
  updateSkills(skills: Skill[]): void;
  updatePlayer(player: Player): void;
  getStatus(): AutoBattleServiceStatus;
  cleanup(): void;
}

export interface AutoBattleServiceOptions {
  player: Player;
  monsters: Monster[];
  skills: Skill[];
  gameData?: GameData;
  skillService?: SkillService;
  audioService?: AudioService;
  config: Partial<AutoBattleConfig>;
  onAttack?: AttackCallback;
  onSkillUse?: SkillUseCallback;
  onLog?: LogCallback;
  onPlayerDeath?: PlayerDeathCallback;
  onPlayerDamage?: PlayerDamageCallback;
  onMonsterDefeated?: MonsterDefeatedCallback;
  onAllMonstersDefeated?: AllMonstersDefeatedCallback;
  onUseItem?: UseItemCallback;
  onRefreshMonsters?: RefreshMonstersCallback;
  onCooldownUpdate?: CooldownUpdateCallback;
  onMonsterAttack?: MonsterAttackCallback;
}

export interface AutoBattleServiceStatus {
  isActive: boolean;
  isPaused: boolean;
  config: AutoBattleConfig;
  stats: AutoBattleStats;
  player: PlayerStatus | null;
  attackInterval: number;
}

export interface PlayerStatus {
  health: string;
  mana: string;
  attackSpeed: number;
}

export interface GameData {
  monsters: Monster[] | Record<string, Monster>;
  items: Item[];
  skills: Skill[];
  maps: MapData[];
}

export interface Item {
  id: number;
  name: string;
  icon: string;
  type: string;
  subcategory?: string;
  description?: string;
  stats?: EquipmentStats;
}

export interface MapData {
  name: string;
  displayName: string;
  level: number;
  monsters: number[];
  bgm?: string;
}

export interface SkillService {
  skills: Skill[];
  initialize(skills: Skill[]): void;
  useSkill(skillId: string, skill: Skill): boolean;
  updateSkillCooldowns(): void;
  cooldownTimerId: number | null;
}

export interface AudioService {
  playMusic(type: 'map' | 'battle', mapName: string): void;
  playAttackSFX(weaponType: string, isCritical: boolean): void;
  playMonsterAttackSFX(monsterIcon: string): void;
  playMonsterDamageSFX(monsterIcon: string): void;
  playMonsterDeathSFX(monsterIcon: string): void;
}

export interface AttackCallback {
  (targetIndex: number, damage: number, isCritical: boolean, isHeal: boolean, 
   skill: Skill | null, isMiss: boolean, weaponIcon: string | null, 
   monsterIcon: string | null): void;
}

export interface SkillUseCallback {
  (skill: Skill): void;
}

export interface LogCallback {
  (message: string): void;
}

export interface PlayerDeathCallback {
  (): void;
}

export interface PlayerDamageCallback {
  (data: PlayerDamageData): void;
}

export interface PlayerDamageData {
  monsterIndex: number;
  monster: Monster;
  damage: number;
  isCritical: boolean;
  isMiss: boolean;
  monsterIcon: string;
}

export interface MonsterDefeatedCallback {
  (targetIndex: number, monster: Monster): void;
}

export interface AllMonstersDefeatedCallback {
  (): void;
}

export interface UseItemCallback {
  (item: Item): void;
}

export interface RefreshMonstersCallback {
  (newConfig?: Partial<AutoBattleConfig>): void;
}

export interface CooldownUpdateCallback {
  (updatedSkills: Skill[]): void;
}

export interface MonsterAttackCallback {
  (monsterIndex: number): void;
}

export interface AutoBattleEvent {
  event: string;
  data: any;
  timestamp: number;
}

export interface AutoBattleErrorInfo {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: string;
  timestamp: number;
  originalError: Error;
}

export interface AutoBattleErrorOptions {
  notifyUser?: boolean;
  stopAutoBattle?: boolean;
  retry?: boolean;
  customMessage?: string;
}

export interface AutoBattleContext {
  player: Player;
  monsters: Monster[];
  skills: Skill[];
  gameData: GameData;
  skillService: SkillService;
  audioService: AudioService;
  userSettings: UserSettings;
  currentMap: CurrentMap;
  gameInitializer: GameInitializer;
  itemData: Item[];
  service?: AutoBattleService;
  startAutoBattle?: () => void;
  stopAutoBattle?: () => void;
  toggleAutoBattle?: () => void;
}

export interface UserSettings {
  targetSelection?: string;
  attackInterval?: number;
  healthThreshold?: number;
  manaThreshold?: number;
  autoUseSkills?: boolean;
  monsterMinLevel?: number;
  monsterMaxLevel?: number;
  monsterDisplayCount?: number;
  autoUseRecoveryItems?: boolean;
  recoveryThreshold?: number;
}

export interface CurrentMap {
  name: string;
  displayName?: string;
}

export interface GameInitializer {
  services: {
    audio: AudioService;
  };
}

export interface DamageCalculationResult {
  damage: number;
  isCritical: boolean;
  isMiss: boolean;
  elementMultiplier: number;
}

export interface MonsterAttackResult {
  damage: number;
  isCritical: boolean;
  isMiss: boolean;
}

export interface BattleLogEntry {
  message: string;
  timestamp: number;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface AutoBattlePreset {
  name: string;
  description: string;
  config: Partial<AutoBattleConfig>;
}

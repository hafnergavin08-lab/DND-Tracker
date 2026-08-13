import { useState } from "react";
import {
  Pencil, Check, Plus, Minus, Trash2, ChevronDown, ChevronUp, X,
  Shield, Zap, Star, BookOpen, Coins, Package, Swords, Scroll, Sparkles,
  Heart, Wind, Dices,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

interface Weapon {
  id: string;
  name: string;
  attackBonus: string;
  damage: string;
  damageType: string;
  range: string;
  properties: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  notes: string;
  equipped: boolean;
}

interface SpellSlotLevel {
  level: number;
  total: number;
  used: number;
}

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  concentration: boolean;
  prepared: boolean;
  description: string;
}

interface CustomSection {
  id: string;
  title: string;
  content: string;
}

type SkillProficiency = { proficient: boolean; expertise: boolean };

// ─── Constants ────────────────────────────────────────────────────────────────

const ABILITY_ABBR: Record<AbilityKey, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
};
const ABILITY_FULL: Record<AbilityKey, string> = {
  str: "Strength", dex: "Dexterity", con: "Constitution",
  int: "Intelligence", wis: "Wisdom", cha: "Charisma",
};
const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

const SKILLS_LIST: Array<{ name: string; ability: AbilityKey }> = [
  { name: "Acrobatics", ability: "dex" },
  { name: "Animal Handling", ability: "wis" },
  { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" },
  { name: "Deception", ability: "cha" },
  { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" },
  { name: "Intimidation", ability: "cha" },
  { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" },
  { name: "Stealth", ability: "dex" },
  { name: "Survival", ability: "wis" },
];

const SPELL_SCHOOLS = [
  "Abjuration", "Conjuration", "Divination", "Enchantment",
  "Evocation", "Illusion", "Necromancy", "Transmutation",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }
function abMod(score: number) { return Math.floor((score - 10) / 2); }
function signed(n: number) { return n >= 0 ? `+${n}` : `${n}`; }
function profBonus(lvl: number) { return Math.ceil(lvl / 4) + 1; }

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded p-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({
  icon, children, editing, onToggleEdit,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-display text-[11px] tracking-[0.22em] uppercase text-primary">{children}</h2>
      </div>
      <button
        onClick={onToggleEdit}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary border border-border hover:border-primary/40 rounded px-2 py-0.5 transition-all"
      >
        {editing ? <><Check size={10} /> Done</> : <><Pencil size={10} /> Edit</>}
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-0.5 font-display">
      {children}
    </div>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <div className="font-body text-sm text-foreground">{children}</div>;
}

function TextInput({
  value, onChange, type = "text", placeholder = "", className = "",
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors ${className}`}
    />
  );
}

function StatBubble({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-secondary rounded border border-border p-2 flex flex-col items-center min-w-[68px]">
      <span className="font-mono text-xl font-bold text-foreground leading-none">{value}</span>
      {sub && <span className="font-mono text-[10px] text-primary mt-0.5">{sub}</span>}
      <span className="text-[9px] tracking-wider uppercase text-muted-foreground text-center mt-1 font-display">{label}</span>
    </div>
  );
}

// ─── Add Spell Sub-form ───────────────────────────────────────────────────────

function AddSpellForm({ onAdd }: { onAdd: (spell: Spell) => void }) {
  const [form, setForm] = useState({
    name: "",
    level: 1,
    school: "Evocation",
    castingTime: "1 action",
    range: "30 ft",
    duration: "Instantaneous",
    concentration: false,
    description: "",
  });

  function handleAdd() {
    if (!form.name.trim()) return;
    onAdd({ id: uid(), ...form, prepared: false });
    setForm({
      name: "", level: 1, school: "Evocation", castingTime: "1 action",
      range: "30 ft", duration: "Instantaneous", concentration: false, description: "",
    });
  }

  const inputCls = "bg-card border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60";

  return (
    <div className="mt-4 bg-secondary/60 rounded border border-border p-3">
      <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3 font-display">Add Spell</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
        <input placeholder="Spell name" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={`col-span-2 ${inputCls}`} />
        <select value={form.level}
          onChange={(e) => setForm((f) => ({ ...f, level: parseInt(e.target.value) }))}
          className={inputCls}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
            <option key={l} value={l}>Level {l}</option>
          ))}
        </select>
        <select value={form.school}
          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
          className={inputCls}>
          {SPELL_SCHOOLS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input placeholder="Casting time" value={form.castingTime}
          onChange={(e) => setForm((f) => ({ ...f, castingTime: e.target.value }))}
          className={inputCls} />
        <input placeholder="Range" value={form.range}
          onChange={(e) => setForm((f) => ({ ...f, range: e.target.value }))}
          className={inputCls} />
        <input placeholder="Duration" value={form.duration}
          onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          className={inputCls} />
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input type="checkbox" checked={form.concentration}
            onChange={(e) => setForm((f) => ({ ...f, concentration: e.target.checked }))}
            className="rounded accent-[#c9a959]" />
          Concentration
        </label>
      </div>
      <textarea placeholder="Description (optional)" value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        rows={2}
        className={`w-full mb-2 resize-none ${inputCls}`} />
      <button onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/10 transition-colors">
        <Plus size={12} /> Add Spell
      </button>
    </div>
  );
}

// ─── Custom Section Card ──────────────────────────────────────────────────────

function CustomSectionCard({
  section, onChange, onDelete,
}: {
  section: CustomSection;
  onChange: (s: CustomSection) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-primary"><Scroll size={14} /></span>
          {editing ? (
            <input value={section.title}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              className="font-display text-[11px] tracking-[0.22em] uppercase bg-secondary border border-border rounded px-2 py-0.5 text-primary focus:outline-none focus:border-primary/60" />
          ) : (
            <h2 className="font-display text-[11px] tracking-[0.22em] uppercase text-primary">{section.title}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing((e) => !e)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary border border-border hover:border-primary/40 rounded px-2 py-0.5 transition-all">
            {editing ? <><Check size={10} /> Done</> : <><Pencil size={10} /> Edit</>}
          </button>
          {editing && (
            <button onClick={onDelete}
              className="flex items-center gap-1 text-[11px] text-destructive border border-destructive/30 hover:border-destructive/60 rounded px-2 py-0.5 transition-all">
              <Trash2 size={10} /> Delete
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <textarea value={section.content}
          onChange={(e) => onChange({ ...section, content: e.target.value })}
          rows={7}
          className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 resize-y font-body leading-relaxed" />
      ) : (
        <div className="text-sm text-foreground whitespace-pre-wrap font-body leading-relaxed">
          {section.content || (
            <span className="text-muted-foreground italic">No content yet. Click Edit to add.</span>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {

  // ── Character Header ──
  const [header, setHeader] = useState({
    name: "Thorin Ironforge",
    class: "Fighter",
    subclass: "Battle Master",
    level: 5,
    race: "Mountain Dwarf",
    background: "Soldier",
    alignment: "Lawful Good",
    playerName: "Player One",
    xp: 6500,
    xpNext: 14000,
    inspiration: false,
  });

  // ── Combat & Vitals ──
  const [combat, setCombat] = useState({
    hp: 45,
    maxHp: 52,
    tempHp: 0,
    ac: 18,
    speed: 25,
    hitDice: "d10",
    hitDiceTotal: 5,
    hitDiceUsed: 1,
    deathSuccesses: 0,
    deathFailures: 0,
  });

  // ── Ability Scores ──
  const [abilities, setAbilities] = useState<Record<AbilityKey, number>>({
    str: 18, dex: 12, con: 16, int: 10, wis: 13, cha: 8,
  });

  // ── Saving Throws ──
  const [saveProficiencies, setSaveProficiencies] = useState<Record<AbilityKey, boolean>>({
    str: true, dex: false, con: true, int: false, wis: false, cha: false,
  });

  // ── Skills ──
  const [skillProfs, setSkillProfs] = useState<Record<string, SkillProficiency>>(() =>
    Object.fromEntries(SKILLS_LIST.map((s) => [s.name, { proficient: false, expertise: false }]))
  );

  // ── Proficiency text blocks ──
  const [profText, setProfText] = useState({
    armor: "All armor, shields",
    weapons: "Simple weapons, martial weapons",
    tools: "Vehicles (land), Smith's tools",
    languages: "Common, Dwarvish",
  });

  // ── Weapons ──
  const [weapons, setWeapons] = useState<Weapon[]>([
    { id: uid(), name: "Battleaxe", attackBonus: "+7", damage: "1d8+4", damageType: "Slashing", range: "5 ft", properties: "Versatile (1d10)" },
    { id: uid(), name: "Handaxe ×2", attackBonus: "+7", damage: "1d6+4", damageType: "Slashing", range: "20/60 ft", properties: "Light, Thrown" },
    { id: uid(), name: "Javelin", attackBonus: "+7", damage: "1d6+4", damageType: "Piercing", range: "30/120 ft", properties: "Thrown" },
  ]);

  // ── Inventory ──
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: uid(), name: "Chain Mail", quantity: 1, weight: 55, notes: "AC 16", equipped: true },
    { id: uid(), name: "Shield", quantity: 1, weight: 6, notes: "+2 AC", equipped: true },
    { id: uid(), name: "Torches", quantity: 10, weight: 10, notes: "1 hour burn time each", equipped: false },
    { id: uid(), name: "Rope, Hempen 50 ft", quantity: 1, weight: 10, notes: "", equipped: false },
    { id: uid(), name: "Rations (1 day)", quantity: 5, weight: 2, notes: "", equipped: false },
    { id: uid(), name: "Healer's Kit", quantity: 1, weight: 3, notes: "10 uses remaining", equipped: false },
    { id: uid(), name: "Potion of Healing", quantity: 2, weight: 1, notes: "Heals 2d4+2 HP", equipped: false },
  ]);
  const [inventoryOpen, setInventoryOpen] = useState(true);

  // ── Currency ──
  const [currency, setCurrency] = useState({ cp: 15, sp: 34, ep: 0, gp: 127, pp: 3 });

  // ── Spellcasting ──
  const [spellcasting, setSpellcasting] = useState({
    class: "—",
    ability: "int" as AbilityKey,
    useAutoCalc: true,
    spellSaveDC: 13,
    spellAttackBonus: 5,
  });
  const [spellSlots, setSpellSlots] = useState<SpellSlotLevel[]>(
    Array.from({ length: 9 }, (_, i) => ({ level: i + 1, total: 0, used: 0 }))
  );
  const [spells, setSpells] = useState<Spell[]>([]);
  const [cantrips, setCantrips] = useState<string[]>([]);
  const [newCantrip, setNewCantrip] = useState("");

  // ── Custom Sections ──
  const [customSections, setCustomSections] = useState<CustomSection[]>([
    {
      id: uid(),
      title: "Class Features",
      content: "Action Surge (1/rest) — Take one additional action on your turn.\nSecond Wind (1/rest) — Bonus action: regain 1d10 + 5 HP.\nExtra Attack — Attack twice when you take the Attack action.\nFighting Style: Defense — +1 AC when wearing armor.\n\nBattle Master Maneuvers (5 superiority dice, d8):\n  • Riposte  • Precision Attack  • Trip Attack\n  • Menacing Attack  • Goading Attack",
    },
    {
      id: uid(),
      title: "Racial Traits",
      content: "Darkvision — 60 ft.\nDwarven Resilience — Advantage on saves vs. poison; resistance to poison damage.\nDwarven Combat Training — Proficiency with battleaxe, handaxe, light hammer, warhammer.\nTool Proficiency — Smith's tools.\nStonecunning — Double proficiency on History checks related to stonework.",
    },
    {
      id: uid(),
      title: "Notes & Lore",
      content: "",
    },
  ]);

  // ── Edit state ──
  const [editing, setEditing] = useState({
    header: false,
    combat: false,
    abilities: false,
    savesSkills: false,
    proficiencies: false,
    weapons: false,
    inventory: false,
    spells: false,
  });

  function toggleEdit(section: keyof typeof editing) {
    setEditing((e) => ({ ...e, [section]: !e[section] }));
  }

  // ── Derived stats ──
  const pb = profBonus(header.level);
  const initiative = abMod(abilities.dex);
  const perceptionProf = skillProfs["Perception"];
  const passivePerception = 10 + abMod(abilities.wis)
    + (perceptionProf?.proficient ? pb : 0)
    + (perceptionProf?.expertise ? pb : 0);
  const spellSaveDC = spellcasting.useAutoCalc
    ? 8 + pb + abMod(abilities[spellcasting.ability])
    : spellcasting.spellSaveDC;
  const spellAtk = spellcasting.useAutoCalc
    ? pb + abMod(abilities[spellcasting.ability])
    : spellcasting.spellAttackBonus;
  const totalWeight = inventory.reduce((acc, it) => acc + it.weight * it.quantity, 0);
  const carryCapacity = abilities.str * 15;
  const gpEquiv = (
    currency.pp * 10 + currency.gp + currency.ep * 0.5 + currency.sp * 0.1 + currency.cp * 0.01
  ).toFixed(2);

  function skillBonus(skill: { name: string; ability: AbilityKey }) {
    const base = abMod(abilities[skill.ability]);
    const prof = skillProfs[skill.name];
    if (prof?.expertise) return base + pb * 2;
    if (prof?.proficient) return base + pb;
    return base;
  }

  function cycleSkillProf(name: string) {
    setSkillProfs((p) => {
      const cur = p[name];
      if (!cur.proficient) return { ...p, [name]: { proficient: true, expertise: false } };
      if (!cur.expertise) return { ...p, [name]: { proficient: true, expertise: true } };
      return { ...p, [name]: { proficient: false, expertise: false } };
    });
  }

  const inputCls = "w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors";
  const smallInputCls = "bg-card border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:border-primary/60 w-full";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background font-body pb-16 scrollbar-none">
      {/* Top banner */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 px-4 py-2 flex items-center gap-3">
        <Dices size={18} className="text-primary" />
        <span className="font-display text-[11px] tracking-[0.3em] uppercase text-primary">D&amp;D Character Sheet</span>
        <div className="flex-1" />
        <button
          onClick={() => setHeader((h) => ({ ...h, inspiration: !h.inspiration }))}
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded border transition-all ${
            header.inspiration
              ? "bg-primary/20 border-primary text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Star size={11} className={header.inspiration ? "fill-primary" : ""} />
          Inspiration
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* ══ CHARACTER HEADER ══════════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<Star size={14} />} editing={editing.header} onToggleEdit={() => toggleEdit("header")}>
            Character Identity
          </SectionTitle>

          {editing.header ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2 md:col-span-4">
                <Label>Character Name</Label>
                <TextInput value={header.name} onChange={(v) => setHeader((h) => ({ ...h, name: v }))} />
              </div>
              <div>
                <Label>Class</Label>
                <TextInput value={header.class} onChange={(v) => setHeader((h) => ({ ...h, class: v }))} />
              </div>
              <div>
                <Label>Subclass / Archetype</Label>
                <TextInput value={header.subclass} onChange={(v) => setHeader((h) => ({ ...h, subclass: v }))} />
              </div>
              <div>
                <Label>Level</Label>
                <TextInput type="number" value={header.level} onChange={(v) => setHeader((h) => ({ ...h, level: Math.max(1, Math.min(20, parseInt(v) || 1)) }))} />
              </div>
              <div>
                <Label>Race</Label>
                <TextInput value={header.race} onChange={(v) => setHeader((h) => ({ ...h, race: v }))} />
              </div>
              <div>
                <Label>Background</Label>
                <TextInput value={header.background} onChange={(v) => setHeader((h) => ({ ...h, background: v }))} />
              </div>
              <div>
                <Label>Alignment</Label>
                <TextInput value={header.alignment} onChange={(v) => setHeader((h) => ({ ...h, alignment: v }))} />
              </div>
              <div>
                <Label>Player Name</Label>
                <TextInput value={header.playerName} onChange={(v) => setHeader((h) => ({ ...h, playerName: v }))} />
              </div>
              <div>
                <Label>Current XP</Label>
                <TextInput type="number" value={header.xp} onChange={(v) => setHeader((h) => ({ ...h, xp: parseInt(v) || 0 }))} />
              </div>
              <div>
                <Label>XP to Next Level</Label>
                <TextInput type="number" value={header.xpNext} onChange={(v) => setHeader((h) => ({ ...h, xpNext: parseInt(v) || 1 }))} />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h1 className="font-display text-4xl md:text-5xl text-foreground leading-none">{header.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="text-primary font-display text-sm tracking-wider">Level {header.level}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-foreground font-body text-sm">{header.class}</span>
                  {header.subclass && (
                    <>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-muted-foreground font-body text-sm">{header.subclass}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border">
                <div><Label>Race</Label><FieldValue>{header.race}</FieldValue></div>
                <div><Label>Background</Label><FieldValue>{header.background}</FieldValue></div>
                <div><Label>Alignment</Label><FieldValue>{header.alignment}</FieldValue></div>
                <div><Label>Player</Label><FieldValue>{header.playerName}</FieldValue></div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <Label>Experience Points</Label>
                    <span className="text-xs text-muted-foreground font-mono">
                      {header.xp.toLocaleString()} / {header.xpNext.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (header.xp / header.xpNext) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ══ COMBAT & VITALS ════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<Heart size={14} />} editing={editing.combat} onToggleEdit={() => toggleEdit("combat")}>
            Combat &amp; Vitals
          </SectionTitle>

          {/* HP Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary rounded border border-border p-3">
              <Label>Hit Points</Label>
              {editing.combat ? (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <div className="text-[9px] text-muted-foreground mb-0.5">Current</div>
                    <input type="number" value={combat.hp}
                      onChange={(e) => setCombat((c) => ({ ...c, hp: parseInt(e.target.value) || 0 }))}
                      className={smallInputCls} />
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground mb-0.5">Maximum</div>
                    <input type="number" value={combat.maxHp}
                      onChange={(e) => setCombat((c) => ({ ...c, maxHp: parseInt(e.target.value) || 1 }))}
                      className={smallInputCls} />
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground mb-0.5">Temporary</div>
                    <input type="number" value={combat.tempHp}
                      onChange={(e) => setCombat((c) => ({ ...c, tempHp: parseInt(e.target.value) || 0 }))}
                      className={smallInputCls} />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="font-mono text-4xl font-bold text-foreground leading-none">{combat.hp}</span>
                    <span className="text-muted-foreground mb-0.5 text-lg">/ {combat.maxHp}</span>
                    {combat.tempHp > 0 && (
                      <span className="text-sky-400 text-sm mb-0.5 ml-1">(+{combat.tempHp} temp)</span>
                    )}
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        combat.hp / combat.maxHp > 0.5 ? "bg-green-700"
                          : combat.hp / combat.maxHp > 0.25 ? "bg-yellow-600"
                          : "bg-red-800"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (combat.hp / combat.maxHp) * 100))}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setCombat((c) => ({ ...c, hp: Math.max(0, c.hp - 1) }))}
                      className="flex-1 py-1 text-xs text-muted-foreground border border-border rounded hover:text-destructive hover:border-destructive/40 transition-colors"
                    >
                      − Damage
                    </button>
                    <button
                      onClick={() => setCombat((c) => ({ ...c, hp: Math.min(c.maxHp, c.hp + 1) }))}
                      className="flex-1 py-1 text-xs text-muted-foreground border border-border rounded hover:text-green-500 hover:border-green-500/40 transition-colors"
                    >
                      + Heal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Death Saves */}
            <div className="bg-secondary rounded border border-border p-3">
              <Label>Death Saving Throws</Label>
              <div className="flex gap-6 mt-2">
                <div>
                  <div className="text-[10px] text-green-500 mb-1.5 font-display tracking-wider">Successes</div>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <button key={i}
                        onClick={() => setCombat((c) => ({ ...c, deathSuccesses: c.deathSuccesses === i + 1 ? i : i + 1 }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          i < combat.deathSuccesses ? "bg-green-700 border-green-500" : "border-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-red-500 mb-1.5 font-display tracking-wider">Failures</div>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <button key={i}
                        onClick={() => setCombat((c) => ({ ...c, deathFailures: c.deathFailures === i + 1 ? i : i + 1 }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          i < combat.deathFailures ? "bg-red-800 border-red-600" : "border-muted-foreground/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Label>Hit Dice</Label>
                {editing.combat ? (
                  <div className="flex gap-2 mt-1">
                    <select value={combat.hitDice}
                      onChange={(e) => setCombat((c) => ({ ...c, hitDice: e.target.value }))}
                      className={`${smallInputCls} flex-1`}>
                      {["d6", "d8", "d10", "d12"].map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <input type="number" value={combat.hitDiceUsed}
                      onChange={(e) => setCombat((c) => ({ ...c, hitDiceUsed: parseInt(e.target.value) || 0 }))}
                      className={`${smallInputCls} w-16`}
                      placeholder="Used" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-foreground text-sm">
                      {combat.hitDiceTotal - combat.hitDiceUsed}/{combat.hitDiceTotal} {combat.hitDice}
                    </span>
                    <button
                      onClick={() => setCombat((c) => ({ ...c, hitDiceUsed: Math.min(c.hitDiceTotal, c.hitDiceUsed + 1) }))}
                      className="text-[11px] text-muted-foreground border border-border rounded px-2 py-0.5 hover:text-primary hover:border-primary/40 transition-colors"
                    >Use</button>
                    <button
                      onClick={() => setCombat((c) => ({ ...c, hitDiceUsed: Math.max(0, c.hitDiceUsed - 1) }))}
                      className="text-[11px] text-muted-foreground border border-border rounded px-2 py-0.5 hover:text-primary hover:border-primary/40 transition-colors"
                    >Regain</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stat bubbles */}
          {editing.combat ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: "Armor Class", key: "ac" as const },
                { label: "Speed (ft)", key: "speed" as const },
              ].map(({ label, key }) => (
                <div key={key} className="bg-secondary rounded border border-border p-2">
                  <div className="text-[9px] text-muted-foreground mb-1 font-display uppercase tracking-wider">{label}</div>
                  <input type="number" value={combat[key]}
                    onChange={(e) => setCombat((c) => ({ ...c, [key]: parseInt(e.target.value) || 0 }))}
                    className={smallInputCls} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <StatBubble label="Armor Class" value={combat.ac} />
              <StatBubble label="Initiative" value={signed(initiative)} sub={`DEX ${signed(abMod(abilities.dex))}`} />
              <StatBubble label="Speed" value={`${combat.speed}`} sub="ft" />
              <StatBubble label="Prof. Bonus" value={`+${pb}`} />
              <StatBubble label="Passive Perc." value={passivePerception} />
              <StatBubble label="Spell Save DC" value={spellSaveDC} />
              <StatBubble label="Spell Attack" value={signed(spellAtk)} />
            </div>
          )}
        </Card>

        {/* ══ ABILITY SCORES ═════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<Zap size={14} />} editing={editing.abilities} onToggleEdit={() => toggleEdit("abilities")}>
            Ability Scores
          </SectionTitle>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {ABILITY_KEYS.map((key) => (
              <div key={key} className="bg-secondary rounded border border-border p-3 flex flex-col items-center">
                <div className="text-[10px] tracking-widest uppercase text-primary mb-2 font-display">{ABILITY_ABBR[key]}</div>
                {editing.abilities ? (
                  <input type="number" min={1} max={30} value={abilities[key]}
                    onChange={(e) => setAbilities((a) => ({ ...a, [key]: Math.max(1, Math.min(30, parseInt(e.target.value) || 10)) }))}
                    className="w-full text-center bg-card border border-border rounded px-1 py-1.5 text-xl font-mono font-bold text-foreground focus:outline-none focus:border-primary/60" />
                ) : (
                  <span className="font-mono text-3xl font-bold text-foreground leading-none">{abilities[key]}</span>
                )}
                <div className="mt-1.5 text-base font-mono text-primary font-bold">{signed(abMod(abilities[key]))}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 text-center font-display">{ABILITY_FULL[key]}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══ PROFICIENCIES & BONUSES ════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<Shield size={14} />} editing={editing.savesSkills} onToggleEdit={() => toggleEdit("savesSkills")}>
            Saving Throws &amp; Skills
          </SectionTitle>
          {editing.savesSkills && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              Click a dot to cycle: <span className="text-muted-foreground">○ none</span> → <span className="text-primary">● proficient</span> → <span className="text-primary">◆ expertise</span>
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Saving Throws */}
            <div>
              <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3 font-display">Saving Throws</div>
              <div className="space-y-1.5">
                {ABILITY_KEYS.map((key) => {
                  const bonus = abMod(abilities[key]) + (saveProficiencies[key] ? pb : 0);
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <button
                        onClick={() => editing.savesSkills && setSaveProficiencies((p) => ({ ...p, [key]: !p[key] }))}
                        className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all ${
                          saveProficiencies[key]
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/50"
                        } ${editing.savesSkills ? "cursor-pointer hover:border-primary/70" : "cursor-default"}`}
                      />
                      <span className="font-mono text-sm text-primary w-8 text-right">{signed(bonus)}</span>
                      <span className="font-display text-[11px] uppercase tracking-wider text-foreground">{ABILITY_ABBR[key]}</span>
                      <span className="text-xs text-muted-foreground">{ABILITY_FULL[key]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div>
              <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-3 font-display">Skills</div>
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                {SKILLS_LIST.map((skill) => {
                  const prof = skillProfs[skill.name];
                  const bonus = skillBonus(skill);
                  return (
                    <div key={skill.name} className="flex items-center gap-2 py-0.5">
                      <button
                        onClick={() => editing.savesSkills && cycleSkillProf(skill.name)}
                        className={`w-3.5 h-3.5 flex-shrink-0 border-2 transition-all ${
                          prof?.expertise
                            ? "bg-primary border-primary rotate-45 rounded-none"
                            : prof?.proficient
                            ? "rounded-full bg-primary border-primary"
                            : "rounded-full border-muted-foreground/50"
                        } ${editing.savesSkills ? "cursor-pointer" : "cursor-default"}`}
                      />
                      <span className="font-mono text-sm text-primary w-8 text-right flex-shrink-0">{signed(bonus)}</span>
                      <span className="text-sm text-foreground flex-1">{skill.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono w-7 flex-shrink-0">{ABILITY_ABBR[skill.ability]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* ══ PROFICIENCY TEXT AREAS ═════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<BookOpen size={14} />} editing={editing.proficiencies} onToggleEdit={() => toggleEdit("proficiencies")}>
            Proficiencies &amp; Languages
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                { label: "Armor Proficiencies", key: "armor" as const },
                { label: "Weapon Proficiencies", key: "weapons" as const },
                { label: "Tool Proficiencies", key: "tools" as const },
                { label: "Languages", key: "languages" as const },
              ] as const
            ).map(({ label, key }) => (
              <div key={key}>
                <Label>{label}</Label>
                {editing.proficiencies ? (
                  <textarea value={profText[key]}
                    onChange={(e) => setProfText((p) => ({ ...p, [key]: e.target.value }))}
                    rows={2}
                    className="w-full mt-0.5 bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/60 resize-none"
                  />
                ) : (
                  <FieldValue>{profText[key] || "—"}</FieldValue>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ══ ATTACKS & WEAPONS ══════════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<Swords size={14} />} editing={editing.weapons} onToggleEdit={() => toggleEdit("weapons")}>
            Attacks &amp; Weapons
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Name", "Atk Bonus", "Damage", "Type", "Range", "Properties", editing.weapons ? "" : null]
                    .filter(Boolean)
                    .map((h) => (
                      <th key={h} className="text-[9px] tracking-widest uppercase text-muted-foreground pb-2 text-left font-display font-normal pr-2">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {weapons.map((w) => (
                  <tr key={w.id} className="border-b border-border/40 hover:bg-secondary/60 group transition-colors">
                    {editing.weapons ? (
                      <>
                        {(["name", "attackBonus", "damage", "damageType", "range", "properties"] as const).map((field) => (
                          <td key={field} className="py-1.5 pr-1.5">
                            <input value={w[field]}
                              onChange={(e) => setWeapons((ws) => ws.map((x) => x.id === w.id ? { ...x, [field]: e.target.value } : x))}
                              className={smallInputCls} />
                          </td>
                        ))}
                        <td className="py-1.5">
                          <button onClick={() => setWeapons((ws) => ws.filter((x) => x.id !== w.id))}
                            className="text-destructive/70 hover:text-destructive transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-3 font-body text-foreground font-medium">{w.name}</td>
                        <td className="py-2 pr-3 font-mono text-primary">{w.attackBonus}</td>
                        <td className="py-2 pr-3 font-mono text-foreground">{w.damage}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{w.damageType}</td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs font-mono">{w.range}</td>
                        <td className="py-2 text-muted-foreground text-xs italic">{w.properties}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editing.weapons && (
            <button
              onClick={() => setWeapons((ws) => [...ws, { id: uid(), name: "New Weapon", attackBonus: "+0", damage: "1d6", damageType: "Slashing", range: "5 ft", properties: "" }])}
              className="mt-3 flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/10 transition-colors"
            >
              <Plus size={12} /> Add Weapon
            </button>
          )}
        </Card>

        {/* ══ INVENTORY ══════════════════════════════════════════════════════ */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-primary"><Package size={14} /></span>
              <h2 className="font-display text-[11px] tracking-[0.22em] uppercase text-primary">Equipment &amp; Inventory</h2>
              <span className="text-[10px] text-muted-foreground font-mono ml-1">
                {totalWeight} / {carryCapacity} lbs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleEdit("inventory")}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary border border-border hover:border-primary/40 rounded px-2 py-0.5 transition-all">
                {editing.inventory ? <><Check size={10} /> Done</> : <><Pencil size={10} /> Edit</>}
              </button>
              <button onClick={() => setInventoryOpen((o) => !o)}
                className="text-muted-foreground hover:text-primary transition-colors">
                {inventoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {inventoryOpen && (
            <>
              {/* Weight bar */}
              <div className="h-1 bg-secondary rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalWeight / carryCapacity > 0.8 ? "bg-red-700" : "bg-primary/60"
                  }`}
                  style={{ width: `${Math.min(100, (totalWeight / carryCapacity) * 100)}%` }}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Item", "Qty", "Wt (lbs)", "Notes", "Equip", editing.inventory ? "" : null]
                        .filter(Boolean)
                        .map((h) => (
                          <th key={h} className="text-[9px] tracking-widest uppercase text-muted-foreground pb-2 text-left font-display font-normal pr-2">
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-border/40 hover:bg-secondary/60 transition-colors">
                        {editing.inventory ? (
                          <>
                            <td className="py-1.5 pr-1.5">
                              <input value={item.name}
                                onChange={(e) => setInventory((inv) => inv.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))}
                                className={smallInputCls} />
                            </td>
                            <td className="py-1.5 pr-1.5">
                              <input type="number" value={item.quantity}
                                onChange={(e) => setInventory((inv) => inv.map((x) => x.id === item.id ? { ...x, quantity: parseInt(e.target.value) || 0 } : x))}
                                className={`${smallInputCls} w-14`} />
                            </td>
                            <td className="py-1.5 pr-1.5">
                              <input type="number" value={item.weight}
                                onChange={(e) => setInventory((inv) => inv.map((x) => x.id === item.id ? { ...x, weight: parseFloat(e.target.value) || 0 } : x))}
                                className={`${smallInputCls} w-16`} />
                            </td>
                            <td className="py-1.5 pr-1.5">
                              <input value={item.notes}
                                onChange={(e) => setInventory((inv) => inv.map((x) => x.id === item.id ? { ...x, notes: e.target.value } : x))}
                                className={smallInputCls} />
                            </td>
                            <td className="py-1.5 pr-1.5">
                              <button
                                onClick={() => setInventory((inv) => inv.map((x) => x.id === item.id ? { ...x, equipped: !x.equipped } : x))}
                                className={`text-xs px-2 py-0.5 rounded border transition-all ${
                                  item.equipped ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground"
                                }`}
                              >
                                {item.equipped ? "Yes" : "No"}
                              </button>
                            </td>
                            <td className="py-1.5">
                              <button onClick={() => setInventory((inv) => inv.filter((x) => x.id !== item.id))}
                                className="text-destructive/70 hover:text-destructive transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-3 text-foreground">{item.name}</td>
                            <td className="py-2 pr-3 font-mono text-foreground">{item.quantity}</td>
                            <td className="py-2 pr-3 font-mono text-muted-foreground">{item.weight}</td>
                            <td className="py-2 pr-3 text-muted-foreground text-xs italic">{item.notes}</td>
                            <td className="py-2">
                              {item.equipped && (
                                <span className="text-[10px] text-primary border border-primary/30 rounded px-1.5 py-0.5 font-display tracking-wider">
                                  Equipped
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {editing.inventory && (
                <button
                  onClick={() => setInventory((inv) => [...inv, { id: uid(), name: "New Item", quantity: 1, weight: 0, notes: "", equipped: false }])}
                  className="mt-3 flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded px-3 py-1.5 hover:bg-primary/10 transition-colors"
                >
                  <Plus size={12} /> Add Item
                </button>
              )}
            </>
          )}
        </Card>

        {/* ══ CURRENCY ═══════════════════════════════════════════════════════ */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary"><Coins size={14} /></span>
            <h2 className="font-display text-[11px] tracking-[0.22em] uppercase text-primary">Coin &amp; Currency</h2>
          </div>
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {(
              [
                { key: "cp" as const, label: "Copper", color: "text-amber-600", bg: "bg-amber-900/20 border-amber-800/30" },
                { key: "sp" as const, label: "Silver", color: "text-slate-300", bg: "bg-slate-700/20 border-slate-600/30" },
                { key: "ep" as const, label: "Electrum", color: "text-teal-300", bg: "bg-teal-900/20 border-teal-700/30" },
                { key: "gp" as const, label: "Gold", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-700/30" },
                { key: "pp" as const, label: "Platinum", color: "text-sky-200", bg: "bg-sky-900/20 border-sky-700/30" },
              ] as const
            ).map(({ key, label, color, bg }) => (
              <div key={key} className={`rounded border p-2 md:p-3 flex flex-col items-center gap-1 ${bg}`}>
                <div className={`text-[10px] tracking-widest uppercase font-display font-bold ${color}`}>
                  {key.toUpperCase()}
                </div>
                <input
                  type="number"
                  min={0}
                  value={currency[key]}
                  onChange={(e) => setCurrency((c) => ({ ...c, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className={`w-full text-center bg-transparent border-none text-xl md:text-2xl font-mono font-bold focus:outline-none ${color}`}
                />
                <div className={`text-[9px] text-muted-foreground font-display`}>{label}</div>
                <div className="flex gap-1 mt-0.5">
                  <button onClick={() => setCurrency((c) => ({ ...c, [key]: Math.max(0, c[key] - 1) }))}
                    className="w-5 h-5 rounded bg-card/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Minus size={9} />
                  </button>
                  <button onClick={() => setCurrency((c) => ({ ...c, [key]: c[key] + 1 }))}
                    className="w-5 h-5 rounded bg-card/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                    <Plus size={9} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-xs text-muted-foreground">
            Total equivalent: <span className="text-yellow-400 font-mono font-bold">{gpEquiv} gp</span>
          </div>
        </Card>

        {/* ══ SPELLCASTING ═══════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle icon={<Sparkles size={14} />} editing={editing.spells} onToggleEdit={() => toggleEdit("spells")}>
            Spellcasting
          </SectionTitle>

          {/* Spell info row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {editing.spells ? (
              <>
                <div>
                  <Label>Spellcasting Class</Label>
                  <TextInput value={spellcasting.class} onChange={(v) => setSpellcasting((s) => ({ ...s, class: v }))} />
                </div>
                <div>
                  <Label>Ability</Label>
                  <select value={spellcasting.ability}
                    onChange={(e) => setSpellcasting((s) => ({ ...s, ability: e.target.value as AbilityKey }))}
                    className={`${inputCls} mt-0`}>
                    {ABILITY_KEYS.map((k) => <option key={k} value={k}>{ABILITY_FULL[k]}</option>)}
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" id="autoCalc" checked={spellcasting.useAutoCalc}
                    onChange={(e) => setSpellcasting((s) => ({ ...s, useAutoCalc: e.target.checked }))}
                    className="accent-[#c9a959]" />
                  <label htmlFor="autoCalc" className="text-xs text-muted-foreground cursor-pointer">
                    Auto-calculate Save DC &amp; Attack Bonus from stats
                  </label>
                </div>
              </>
            ) : (
              <>
                <StatBubble label="Spell Save DC" value={spellSaveDC} />
                <StatBubble label="Spell Attack" value={signed(spellAtk)} />
                <div className="bg-secondary rounded border border-border p-2 flex flex-col items-center">
                  <span className="font-body text-sm text-foreground">{spellcasting.class}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 font-display">Class</span>
                </div>
                <div className="bg-secondary rounded border border-border p-2 flex flex-col items-center">
                  <span className="font-body text-sm text-foreground">{ABILITY_FULL[spellcasting.ability]}</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 font-display">Ability</span>
                </div>
              </>
            )}
          </div>

          {/* Spell Slots */}
          <div className="mb-5">
            <Label>Spell Slots</Label>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mt-2">
              {spellSlots.map((slot) => (
                <div key={slot.level} className="bg-secondary rounded border border-border p-2">
                  <div className="text-[9px] text-center text-muted-foreground mb-1.5 font-display tracking-wider">LV {slot.level}</div>
                  {editing.spells ? (
                    <input type="number" min={0} max={9} value={slot.total}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setSpellSlots((ss) => ss.map((s) =>
                          s.level === slot.level ? { ...s, total: val, used: Math.min(s.used, val) } : s
                        ));
                      }}
                      className="w-full text-center bg-card border border-border rounded px-1 py-0.5 text-sm text-foreground focus:outline-none focus:border-primary/60" />
                  ) : (
                    <div>
                      <div className="flex flex-wrap gap-0.5 justify-center min-h-[14px] mb-1">
                        {Array.from({ length: slot.total }).map((_, i) => (
                          <button key={i}
                            onClick={() => setSpellSlots((ss) => ss.map((s) =>
                              s.level === slot.level ? { ...s, used: i < s.used ? i : i + 1 } : s
                            ))}
                            className={`w-3 h-3 rounded-full border transition-all ${
                              i < slot.used ? "bg-muted border-muted-foreground/40" : "bg-primary/70 border-primary"
                            }`}
                          />
                        ))}
                        {slot.total === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                      </div>
                      {slot.total > 0 && (
                        <div className="text-[9px] text-center text-muted-foreground font-mono">
                          {slot.total - slot.used}/{slot.total}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cantrips */}
          <div className="mb-5">
            <Label>Cantrips (At Will)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {cantrips.map((c, i) => (
                <div key={i}
                  className="flex items-center gap-1.5 bg-secondary border border-border rounded px-2.5 py-1 text-sm text-foreground">
                  <Sparkles size={10} className="text-primary" />
                  {c}
                  {editing.spells && (
                    <button onClick={() => setCantrips((cs) => cs.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive ml-1 transition-colors">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              {editing.spells && (
                <div className="flex gap-1">
                  <input value={newCantrip}
                    onChange={(e) => setNewCantrip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCantrip.trim()) {
                        setCantrips((cs) => [...cs, newCantrip.trim()]);
                        setNewCantrip("");
                      }
                    }}
                    placeholder="Add cantrip…"
                    className="bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
                  <button
                    onClick={() => { if (newCantrip.trim()) { setCantrips((cs) => [...cs, newCantrip.trim()]); setNewCantrip(""); } }}
                    className="text-primary border border-primary/30 rounded px-2 hover:bg-primary/10 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              )}
              {cantrips.length === 0 && !editing.spells && (
                <span className="text-muted-foreground text-sm italic">No cantrips known.</span>
              )}
            </div>
          </div>

          {/* Spell List grouped by level */}
          <div>
            <Label>Spells Known / Prepared</Label>
            {spells.length === 0 && !editing.spells && (
              <p className="text-muted-foreground text-sm italic mt-2">No spells added yet. Click Edit to add spells.</p>
            )}
            <div className="mt-2 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const lvlSpells = spells.filter((s) => s.level === lvl);
                if (lvlSpells.length === 0) return null;
                return (
                  <div key={lvl}>
                    <div className="text-[9px] tracking-widest uppercase text-muted-foreground mb-1.5 font-display">
                      Level {lvl} Spells
                    </div>
                    <div className="space-y-1.5">
                      {lvlSpells.map((spell) => (
                        <div key={spell.id} className="bg-secondary rounded border border-border p-2.5 flex items-start gap-2.5">
                          <button
                            onClick={() => setSpells((ss) => ss.map((s) => s.id === spell.id ? { ...s, prepared: !s.prepared } : s))}
                            title={spell.prepared ? "Prepared" : "Unprepared"}
                            className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all ${
                              spell.prepared ? "bg-primary border-primary" : "border-muted-foreground/50"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-body text-sm text-foreground font-medium">{spell.name}</span>
                              <span className="text-[10px] text-primary border border-primary/30 rounded px-1.5 py-0 font-display">{spell.school}</span>
                              {spell.concentration && (
                                <span className="text-[10px] text-accent-foreground bg-accent/40 rounded px-1.5 py-0">Conc.</span>
                              )}
                              <span className="text-[10px] text-muted-foreground">{spell.castingTime}</span>
                              <span className="text-[10px] text-muted-foreground">{spell.range}</span>
                              <span className="text-[10px] text-muted-foreground">{spell.duration}</span>
                            </div>
                            {spell.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">{spell.description}</p>
                            )}
                          </div>
                          {editing.spells && (
                            <button onClick={() => setSpells((ss) => ss.filter((s) => s.id !== spell.id))}
                              className="text-destructive/70 hover:text-destructive transition-colors flex-shrink-0 mt-0.5">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {editing.spells && <AddSpellForm onAdd={(spell) => setSpells((ss) => [...ss, spell])} />}
          </div>
        </Card>

        {/* ══ CUSTOM SECTIONS ════════════════════════════════════════════════ */}
        {customSections.map((section) => (
          <CustomSectionCard
            key={section.id}
            section={section}
            onChange={(updated) => setCustomSections((cs) => cs.map((s) => s.id === section.id ? updated : s))}
            onDelete={() => setCustomSections((cs) => cs.filter((s) => s.id !== section.id))}
          />
        ))}

        <button
          onClick={() => setCustomSections((cs) => [...cs, { id: uid(), title: "New Section", content: "" }])}
          className="w-full flex items-center justify-center gap-2 text-sm text-primary border border-primary/25 border-dashed rounded py-3 hover:bg-primary/5 transition-colors font-display tracking-wider"
        >
          <Plus size={14} /> Add Custom Section
        </button>

      </div>
    </div>
  );
}

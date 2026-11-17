/**
 * The shared design system — the public API of `src/components/ui`. Rules for using it: the design-system skill.
 *
 * Screens import from `@/components/ui`, never from a file inside it, so a component can be split or renamed
 * without touching call sites. A component used by one feature belongs in that feature's `components/` folder
 * ("start local, promote when shared" — AGENTS.md).
 */

// Text and surfaces
export { Body, Caption, ErrorText, Heading, Mono, Muted, Overline, Subtitle, Title } from './Text';
export type { BodyProps, CaptionProps, MutedProps, TitleProps } from './Text';
export { Card, Section, type CardProps, type SectionProps } from './Card';
export { Screen, type ScreenProps } from './Screen';
export { ScreenHeader, type ScreenHeaderProps } from './ScreenHeader';
export { BottomBar } from './BottomBar';

// Actions
export { Button, type AppButtonProps } from './Button';
export { IconButton, type IconButtonProps } from './IconButton';
export { ActionTile, type ActionTileProps } from './ActionTile';
export { ActionBanner, type ActionBannerProps } from './ActionBanner';
export { QuickActions, type QuickAction } from './QuickActions';
export { useBrandSolid } from './useBrandSolid';

// Records and lists
export { ListRow, SectionCard, type ListRowProps, type SectionCardProps } from './ListRow';
export { Field, MetaItem, MetaRow, type FieldProps } from './MetaRow';
export { DetailLoading, ListError, RecordList, type RecordListProps } from './RecordList';
export { ListSkeleton } from './ListSkeleton';
export { usePullToRefresh } from './usePullToRefresh';
export { SearchBar, type SearchBarProps } from './SearchBar';
export { SegmentedTabs, type SegmentedTab, type SegmentedTabsProps } from './SegmentedTabs';
export { Chip, ChipRow, type ChipProps } from './Chip';
export { StatusPill, TONE_THEME, type StatusPillProps, type StatusTone } from './StatusPill';
export { StatGroup, type Stat } from './StatGroup';
export { HeroFact, type HeroFactProps } from './HeroFact';
export { IdentityTile, initials, type IdentityTileProps } from './IdentityTile';
export { Avatar, type AvatarProps } from './Avatar';
export { Timeline, type TimelineEntry, type TimelineTint } from './Timeline';
export { ExpandableText, type ExpandableTextProps } from './ExpandableText';
export { FormSummaryCard, SummaryRow, type FormSummaryCardProps } from './FormSummaryCard';

// Forms and sheets
export { FIELD_FOCUS, FIELD_HEIGHT, FieldLabel, FieldMessage, fieldFrame } from './FieldChrome';
export { TextField, type TextFieldProps } from './TextField';
export { FieldGroup, SectionIcon, SelectField, toOptions, type SelectFieldProps, type SelectOption } from './SelectField';
export { ChoiceField, type ChoiceFieldProps, type ChoiceOption } from './ChoiceField';
export { DateField, type DateFieldProps } from './DateField';
export { Sheet, SheetActions, useSheetHandle, type SheetHandle, type SheetProps } from './Sheet';
export { FilterSheet, type FilterSheetProps } from './FilterSheet';

// Feedback
export { EmptyState, OfflineState, type EmptyStateProps } from './EmptyState';
export { OfflineBanner } from './OfflineBanner';
export { Spinner } from './Spinner';
export { Tooltip, type TooltipProps } from './Tooltip';

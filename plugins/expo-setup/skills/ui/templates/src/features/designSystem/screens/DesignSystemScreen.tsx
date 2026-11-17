import { CalendarDays, Hash, Mail, MapPin, Package, Phone, Plus, Share2, SlidersHorizontal, TriangleAlert } from 'lucide-react-native';
import { useRef, useState, useSyncExternalStore } from 'react';
import { XStack, YStack } from 'tamagui';

import {
  ActionBanner,
  ActionTile,
  Avatar,
  Body,
  BottomBar,
  Button,
  Caption,
  Card,
  ChipRow,
  Chip,
  ChoiceField,
  DateField,
  EmptyState,
  FieldGroup,
  FormSummaryCard,
  Heading,
  HeroFact,
  IconButton,
  IdentityTile,
  ListRow,
  Mono,
  Muted,
  Overline,
  QuickActions,
  Screen,
  SearchBar,
  SectionCard,
  SegmentedTabs,
  SelectField,
  Sheet,
  SheetActions,
  StatGroup,
  StatusPill,
  Subtitle,
  TextField,
  Timeline,
  Title,
  type StatusTone,
} from '@/components/ui';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { confirm, notify } from '@/lib/core';
import { getAppearance, setAppearance, subscribeAppearance, type AppearancePreference } from '@/theme/appearance.store';

const TONES: StatusTone[] = ['neutral', 'info', 'success', 'warning', 'danger', 'muted'];

/**
 * Every primitive on one screen, in the current scheme — the check to run on a **device**, in light and dark,
 * after changing the brand colour, the palette or a component. Contrast ratios are arithmetic; how a ramp feels is not.
 *
 * Development only: the route (`src/app/design-system.tsx`) redirects away in release builds. Delete the feature when
 * the app no longer needs it.
 */
export default function DesignSystemScreen() {
  const appearance = useSyncExternalStore(subscribeAppearance, getAppearance, getAppearance);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'open' | 'closed'>('all');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>();
  const [priority, setPriority] = useState<string>();
  const [due, setDue] = useState<string>();
  const sheet = useRef<BottomSheetModal>(null);

  return (
    <Screen
      scroll
      gap="$5"
      footer={
        <BottomBar note="A pinned action bar — Screen's footer">
          <Button flex={1}>Cancel</Button>
          <Button flex={2} variant="primary" onPress={() => notify.success('Saved')}>
            Save
          </Button>
        </BottomBar>
      }
    >
      <SegmentedTabs<AppearancePreference>
        tabs={[
          { key: 'system', label: 'System' },
          { key: 'light', label: 'Light' },
          { key: 'dark', label: 'Dark' },
        ]}
        value={appearance}
        onChange={setAppearance}
      />

      <YStack gap="$1.5">
        <Overline>Text roles</Overline>
        <Title>Title 28</Title>
        <Heading>Heading 20</Heading>
        <Subtitle>Subtitle 16 — a row or card title</Subtitle>
        <Body>Body 15 — default copy and values.</Body>
        <Muted>Muted 13 — secondary text under a title.</Muted>
        <Caption>Caption 12 — metadata, timestamps.</Caption>
        <Mono>ORD-2026-0042</Mono>
      </YStack>

      <YStack gap="$2.5">
        <Overline>Buttons</Overline>
        <XStack gap="$2.5">
          <Button flex={1} variant="primary">Primary</Button>
          <Button flex={1}>Secondary</Button>
        </XStack>
        <XStack gap="$2.5">
          <Button flex={1} variant="ghost">Ghost</Button>
          <Button
            flex={1}
            variant="destructive"
            onPress={() =>
              void confirm({ title: 'Delete this order?', description: 'This cannot be undone.', variant: 'destructive' })
            }
          >
            Delete
          </Button>
        </XStack>
        <Button variant="primary" loading>
          Saving
        </Button>
        <XStack gap="$3" items="center">
          <IconButton icon={SlidersHorizontal} accessibilityLabel="Filters" variant="outline" badge={2} />
          <IconButton icon={Plus} accessibilityLabel="New order" variant="brand" />
          <IconButton icon={Share2} accessibilityLabel="Share" variant="soft" />
          <IconButton icon={Phone} accessibilityLabel="Call" />
        </XStack>
      </YStack>

      <YStack gap="$2.5">
        <Overline>Status and chips</Overline>
        <XStack flexWrap="wrap" gap="$2">
          {TONES.map((tone) => (
            <StatusPill key={tone} label={tone} tone={tone} />
          ))}
        </XStack>
        <ChipRow>
          <Chip label="All" selected count={12} />
          <Chip label="Due today" tone="warning" dot />
          <Chip label="Overdue" tone="danger" dot />
          <Chip label="Mine" tone="brand" />
        </ChipRow>
      </YStack>

      <YStack gap="$2.5">
        <Overline>List header</Overline>
        <XStack gap="$2">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search orders" />
          <IconButton icon={SlidersHorizontal} accessibilityLabel="Filters" variant="outline" size="lg" />
        </XStack>
        <SegmentedTabs
          tabs={[
            { key: 'all', label: 'All', count: 24 },
            { key: 'open', label: 'Open', count: 9 },
            { key: 'closed', label: 'Closed' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </YStack>

      <YStack gap="$2.5">
        <Overline>A list card</Overline>
        <Card pressable onPress={() => notify.info('Opened')}>
          <XStack items="center" gap="$3">
            <IdentityTile label="Acme Traders" tone="info" />
            <YStack flex={1} minW={0}>
              <Subtitle numberOfLines={1}>Acme Traders</Subtitle>
              <Mono>ORD-0042</Mono>
            </YStack>
            <StatusPill label="Open" tone="info" size="sm" />
          </XStack>
        </Card>
      </YStack>

      <YStack gap="$3">
        <Overline>Detail hero</Overline>
        <Card gap="$3.5">
          <XStack items="center" gap="$3">
            <Avatar name="Jane Doe" size="lg" />
            <YStack flex={1}>
              <Heading>Jane Doe</Heading>
              <Muted>Customer since 2024</Muted>
            </YStack>
          </XStack>
          <StatGroup
            stats={[
              { label: 'Orders', value: 18 },
              { label: 'Overdue', value: 2, tone: 'danger' },
              { label: 'Paid', value: '₹42,000', tone: 'success' },
            ]}
          />
          <HeroFact icon={CalendarDays} label="Next delivery">
            <Body>Tomorrow, 10:30 am</Body>
          </HeroFact>
        </Card>
        <QuickActions
          actions={[
            { key: 'call', label: 'Call', icon: Phone, onPress: () => notify.info('Call') },
            { key: 'mail', label: 'Email', icon: Mail, onPress: () => notify.info('Email') },
            { key: 'map', label: 'Directions', icon: MapPin, onPress: () => notify.info('Directions') },
          ]}
        />
        <ActionBanner
          icon={TriangleAlert}
          title="2 invoices are overdue"
          subtitle="Tap to review them"
          onPress={() => notify.info('Review')}
        />
        <XStack gap="$2.5">
          <ActionTile icon={Package} label="New order" onPress={() => notify.info('New order')} />
          <ActionTile icon={Hash} label="Scan" tone="neutral" onPress={() => notify.info('Scan')} />
        </XStack>
      </YStack>

      <SectionCard title="Details">
        <ListRow title="Phone" value="+91 98765 43210" icon={Phone} />
        <ListRow title="Email" value="jane@example.com" icon={Mail} />
        <ListRow title="Address" icon={MapPin} />
        <ListRow title="Open the order history" onPress={() => notify.info('History')} />
        <ListRow title="Delete customer" destructive onPress={() => notify.error('Not really')} />
      </SectionCard>

      <SectionCard title="Activity" padded>
        <Timeline
          entries={[
            { key: '1', title: 'Order placed', meta: 'Today, 9:12 am', tone: 'accent' },
            { key: '2', title: 'Payment received', body: '₹12,000 by UPI', meta: 'Yesterday', tint: 'green' },
            { key: '3', title: 'Customer created', meta: '12 Mar', tone: 'muted' },
          ]}
        />
      </SectionCard>

      <FieldGroup title="A form section" icon={Package}>
        <TextField label="Name" required value={name} onChangeText={setName} placeholder="Customer name" />
        <TextField label="Notes" multiline grow hint="Visible to your team only" />
        <TextField label="Email" error="Enter a valid email" value="jane@" />
        <SelectField
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { id: 'retail', label: 'Retail' },
            { id: 'wholesale', label: 'Wholesale', detail: 'Bulk pricing' },
          ]}
        />
        <ChoiceField
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { id: 'low', label: 'Low' },
            { id: 'normal', label: 'Normal' },
            { id: 'high', label: 'High' },
          ]}
        />
        <DateField label="Due date" value={due} onChange={setDue} clearable />
      </FieldGroup>

      <FormSummaryCard icon={Package} title="Acme Traders" subtitle="ORD-0042" mono>
        <StatusPill label="Draft" tone="muted" size="sm" />
      </FormSummaryCard>

      <Button onPress={() => sheet.current?.present()}>Open a sheet</Button>
      <Sheet ref={sheet} title="A bottom sheet" description="Sheets hold pickers, filters and short forms.">
        <SheetActions>
          <Button flex={1} onPress={() => sheet.current?.dismiss()}>
            Close
          </Button>
        </SheetActions>
      </Sheet>

      <Card flush>
        <EmptyState title="No orders yet" description="Orders you create appear here." action={<Button variant="primary">Add an order</Button>} />
      </Card>
    </Screen>
  );
}

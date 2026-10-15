---
name: mobile-ui
description: {{APP_NAME}} mobile UI building blocks beyond Tamagui — bottom sheets (@gorhom/bottom-sheet), keyboard handling (react-native-keyboard-controller), lists (FlashList v2), forms (react-hook-form + zod), icons (lucide-react-native), blur (expo-blur), lodash. Use when building screens, lists, forms, sheets, or anything with text input.
---

# Mobile UI building blocks

All providers are already mounted in `src/providers/AppProviders.tsx` (GestureHandlerRootView → CoreQueryProvider → TamaguiProvider → ToastProvider → KeyboardProvider → BottomSheetModalProvider). Never add them again. The app runs in a **development build** (not Expo Go). Style everything with Tamagui tokens (`tamagui` skill).

## Lists — `@shopify/flash-list` v2

Every list of records uses FlashList (not FlatList/ScrollView+map). v2: **no `estimatedItemSize`** (removed), `maintainVisibleContentPosition` on by default.
```tsx
const { items, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching, isLoading, error } =
  leadQueries.useInfiniteList({ search });

<FlashList
  data={items}
  keyExtractor={(lead) => String(lead.id)}
  renderItem={({ item }) => <LeadRow lead={item} />}
  onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
  onEndReachedThreshold={0.5}
  refreshing={isRefetching}
  onRefresh={refetch}
  ListEmptyComponent={isLoading ? <LoadingState /> : <EmptyState />}
  ListFooterComponent={isFetchingNextPage ? <Spinner my="$4" /> : null}
/>
```
Always handle loading, error, empty, pull-to-refresh, and next-page states. Keep `renderItem` rows as memo-free components (React Compiler handles it).

## Bottom sheets — `@gorhom/bottom-sheet` v5

Use `BottomSheetModal` (presented on demand) for pickers, filters, quick actions, forms.
```tsx
const sheetRef = useRef<BottomSheetModal>(null);
const theme = useTheme();

<Button onPress={() => sheetRef.current?.present()}>Filters</Button>
<BottomSheetModal
  ref={sheetRef}
  enableDynamicSizing            // size to content; don't combine with snapPoints
  backdropComponent={(p) => <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} />}
  backgroundStyle={{ backgroundColor: theme.background.val }}
  handleIndicatorStyle={{ backgroundColor: theme.color8.val }}
  keyboardBehavior="interactive"
  keyboardBlurBehavior="restore"
  android_keyboardInputMode="adjustResize"
>
  <BottomSheetView>
    <YStack p="$4" gap="$3">…</YStack>
  </BottomSheetView>
</BottomSheetModal>
```
- Close with `sheetRef.current?.dismiss()`.
- Inputs inside a sheet: **`BottomSheetTextInput`** only — do not use keyboard-controller's `KeyboardAwareScrollView` inside sheets (both libraries would react to the keyboard).
- Scrollable content: `BottomSheetScrollView`; long lists: `BottomSheetFlatList`, or FlashList via `renderScrollComponent={BottomSheetScrollView}`. `BottomSheetFlashList` is deprecated.
- Known New-Architecture issues (first-open lag, keyboard with inputs) — test sheets on a device.

## Keyboard — `react-native-keyboard-controller`

Recommended by Expo; not in Expo Go.
- Form screens: `KeyboardAwareScrollView` (`bottomOffset={16}`) instead of `ScrollView` + `KeyboardAvoidingView`.
- Bars pinned above the keyboard (chat input, "Save" bar): `KeyboardStickyView`.
- Prev/Next/Done toolbar for multi-field forms: `<KeyboardToolbar />`.
- Dismiss: `KeyboardController.dismiss()`.
- Use the library's `KeyboardAvoidingView`, never React Native's.

## Forms — react-hook-form + zod

Validation schemas live in the feature's `schemas/` (the same zod schemas the service uses).
```tsx
const form = useForm<CreateLeadDto>({ resolver: zodResolver(CreateLeadSchema), defaultValues: { name: '', email: '' } });
const createLead = leadQueries.useCreate({ meta: { successMessage: 'Lead created' } });

<Controller
  control={form.control}
  name="email"
  render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
    <YStack gap="$1">
      <Label htmlFor="email">Email</Label>
      <Input id="email" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="email-address" autoCapitalize="none" />
      {error ? <Paragraph size="$2" color="$red10">{error.message}</Paragraph> : null}
    </YStack>
  )}
/>
<Button disabled={createLead.isPending} onPress={form.handleSubmit((values) => createLead.mutate(values))}>Save</Button>
```
`import { zodResolver } from '@hookform/resolvers/zod'`. Show server validation errors (`ApiError.messages`) via the global toast (automatic) — don't duplicate.

## Icons — `lucide-react-native`

Named imports only (tree-shaken): `import { Phone, Mail } from 'lucide-react-native'`. Color from the theme (`theme.color11.val`), size in dp (16/20/24). In Tamagui `Button`: `icon={Phone}`.

## Blur — `expo-blur` (SDK 57+)

On Android, blur only renders with a **`BlurTargetView`** wrapping the content and `blurTarget` pointing to it:
```tsx
const targetRef = useRef<View>(null);
<BlurTargetView ref={targetRef} style={{ flex: 1 }}>{content}</BlurTargetView>
<BlurView blurTarget={targetRef} blurMethod="dimezisBlurViewSdk31Plus" intensity={60} tint="systemMaterial" style={StyleSheet.absoluteFill} />
```
Use sparingly (headers, overlays) — blur is expensive on Android.

## lodash

Per-method imports only: `import debounce from 'lodash/debounce'` — never `import _ from 'lodash'` or `import { x } from 'lodash'` (pulls the whole library into the bundle). For debouncing inputs prefer the core's `useDebounce` / `useDebouncedCallback`.

import { SizableText, XStack, type GetProps } from 'tamagui';

import { initials } from './IdentityTile';

/**
 * Initials in a circle — the assignee of a record, the author of an activity.
 *
 * No image variant on purpose: an `Avatar` that accepted a `src` would be a slot nothing can fill until the API
 * returns a user avatar. Add it when there is a URL to put in it.
 */
export interface AvatarProps extends Omit<GetProps<typeof XStack>, 'children'> {
  /** A person's full name. Initials are derived; a falsy name renders a neutral placeholder. */
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const DIMENSION = { sm: 24, md: 32, lg: 44 } as const;
const TEXT_SIZE = { sm: '$1', md: '$2', lg: '$5' } as const;


export function Avatar({ name, size = 'md', ...props }: AvatarProps) {
  const text = name ? initials(name) : '';
  const dimension = DIMENSION[size];

  return (
    <XStack
      width={dimension}
      height={dimension}
      // No `$full` radius token exists; a circle tracks its own dimension.
      rounded={1000}
      bg="$color4"
      items="center"
      justify="center"
      shrink={0}
      {...props}
    >
      <SizableText size={TEXT_SIZE[size]} fontWeight="600" color="$color11">
        {text}
      </SizableText>
    </XStack>
  );
}

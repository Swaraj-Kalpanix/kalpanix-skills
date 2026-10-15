"""Generate every Expo app icon + the splash image from one logo.

    python makeIcons.py --logo <logo.png> --out <project>/assets/images [--mark x0,y0,x1,y1] [--bg #FFFFFF]

--logo   the full logo (PNG with transparency works best). Copied to <out>/logo.png.
--mark   optional crop box (pixels) of the *symbol* inside the logo, for logos that are
         symbol + wordmark. Icons use the symbol; the splash always uses the full logo.
         Omit it when the logo is already a square symbol.
--bg     icon background colour (iOS icon is opaque; Android adaptive background).

Writes (all 1024x1024):
  icon.png                     iOS / main icon — opaque, mark at ~62%
  android-icon-foreground.png  adaptive foreground — mark inside the 66% safe zone
  android-icon-background.png  adaptive background — solid --bg
  android-icon-monochrome.png  Android 13+ themed icon — white silhouette of the mark
  splash-icon.png              full logo at 60%, transparent (Android 12+ shows it in a circle)
"""
import argparse
import os

from PIL import Image

S = 1024


def place(img, box_size, canvas_bg):
    """Scale img to fit a box_size square and center it on a 1024 canvas."""
    img = img.copy()
    img.thumbnail((box_size, box_size), Image.LANCZOS)
    canvas = Image.new('RGBA', (S, S), canvas_bg)
    canvas.alpha_composite(img, ((S - img.width) // 2, (S - img.height) // 2))
    return canvas


def hex_rgba(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--logo', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--mark', help='x0,y0,x1,y1 crop box of the symbol inside the logo')
    parser.add_argument('--bg', default='#FFFFFF')
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    logo = Image.open(args.logo).convert('RGBA')
    logo_out = os.path.join(args.out, 'logo.png')
    if os.path.abspath(args.logo) != os.path.abspath(logo_out):
        logo.save(logo_out)

    mark = logo.crop(tuple(int(v) for v in args.mark.split(','))) if args.mark else logo
    mark = mark.crop(mark.getbbox())
    bg = hex_rgba(args.bg)
    clear = (0, 0, 0, 0)

    place(mark, 640, bg).convert('RGB').save(os.path.join(args.out, 'icon.png'))
    place(mark, 460, clear).save(os.path.join(args.out, 'android-icon-foreground.png'))
    Image.new('RGB', (S, S), bg[:3]).save(os.path.join(args.out, 'android-icon-background.png'))

    silhouette = Image.new('RGBA', mark.size, (255, 255, 255, 255))
    silhouette.putalpha(mark.getchannel('A'))
    place(silhouette, 460, clear).save(os.path.join(args.out, 'android-icon-monochrome.png'))

    full = logo.crop(logo.getbbox())
    place(full, int(S * 0.60), clear).save(os.path.join(args.out, 'splash-icon.png'))

    for name in ['icon', 'android-icon-foreground', 'android-icon-background',
                 'android-icon-monochrome', 'splash-icon', 'logo']:
        im = Image.open(os.path.join(args.out, f'{name}.png'))
        print(f'{name}.png', im.size, im.mode)


if __name__ == '__main__':
    main()

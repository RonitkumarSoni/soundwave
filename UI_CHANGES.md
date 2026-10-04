# Soundwave UI fixes — 2026-10-02

- Disabled unsolicited saved-account autofill at Android activity and input level; removed auth auto-focus and dismiss the keyboard on route changes.
- Generated a new purple/magenta Soundwave S/play emblem with the built-in image generator. Launcher, adaptive icon, splash and favicon use assets/images/soundwave-logo-v2.png.
- Draw a consistent dark-purple background behind the transparent Android status bar. Toasts and search retry messages respect the top safe area.
- Replaced the artificial waveform with a straight seek track, draggable thumb, time labels and accessibility seek actions.
- Added notification Stop capability; serialized native controls and clear track/progress plus native queue on stop. Android/OEM controls determine the final notification layout.

Validation: TypeScript, lint, 5 frontend tests, native autofill-plugin insertion/idempotence fixture and Android Hermes export passed. No phone is connected; actual installed-device autofill dismissal, seeking, lock-screen controls and startup remain manual checks. No claim of zero device crashes is made.

Image-generation prompt (built-in tool):
Use case: logo-brand. Generate a production Android music app icon for Soundwave, matching a refined deep-purple music player. Single centered original emblem combining a smooth flowing S-shaped sound ribbon and subtle play triangle negative space. Luminous violet to magenta gradient emblem on uniform dark aubergine #170B2E full square background. Bold simple recognizable silhouette at small sizes, restrained premium flat graphic, no text, no lettering, no mockup, no outer rounded-square border, no shadows outside the emblem. Emblem contained in central 60% of square with generous safe space for circular Android masking. Square high resolution PNG.

References:
https://reactnative.dev/docs/textinput.html
https://developer.android.com/develop/ui/views/layout/edge-to-edge
https://developer.android.com/identity/autofill/autofill-optimize

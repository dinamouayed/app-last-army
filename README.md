# Last Army

Endless 3-lane army shooter/runner for iOS first, with Android compatibility. The world is generated procedurally and keeps going until the army is gone. There are no hand-designed levels.

Swipe between lanes, shoot automatically, and survive as far as you can. Distance is the score.

## Stack

- React Native and [Expo](https://docs.expo.dev/versions/v57.0.0/)
- TypeScript
- [React Native Skia](https://shopify.github.io/react-native-skia/) for rendering
- Data-oriented game loop: simulation lives outside React state

## Getting started

```sh
npm install
npm start
```

Then open the app on iOS, Android, or web from the Expo CLI.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npm run ios` | Start on iOS |
| `npm run android` | Start on Android |
| `npm run web` | Start in the browser |
| `npm test` | Run Jest tests |
| `npm run typecheck` | Type-check with TypeScript |

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0).

You may use, change, and distribute the software for noncommercial purposes only. Commercial use is not allowed under these terms.

The official license text is in [`LICENSE`](./LICENSE).

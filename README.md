# actions

GitHub Actions のワークフローと `dependabot.yml` を、GUI の選択操作だけで生成するツール。
公開先: <https://rs256.net/actions/>

生成できるファイル:

| ファイル | 内容 |
|---|---|
| `.github/workflows/ci.yml` | PR ごとの検査（lint / test / build）と Dependabot PR の自動マージ |
| `.github/workflows/deploy.yml` | GitHub Pages へのデプロイ、または任意のデプロイコマンド |
| `.github/dependabot.yml` | 依存関係の自動更新（17 の ecosystem / グループ化 / スケジュール） |
| `.github/workflows/dependabot-auto-merge.yml` | 自動マージを `branch-protection` 方式にしたときのみ |

生成はすべてブラウザ内で完結する。外部 API 呼び出しは無い。

## 開発

```bash
npm install
npm run dev
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | `vue-tsc -b` の後にビルド |
| `npm test` | Vitest（生成器のスナップショットと妥当性検査） |
| `npm run lint` | Biome + 非 ASCII 文字の検査 |
| `npm run lint:fix` | Biome の自動修正 |
| `npm run check:ascii` | 非 ASCII 文字の検査のみ |

`vite.config.ts` の `base` は `/actions/`。`rs256.net` は `RS-256.github.io` のカスタムドメインなので、
このリポジトリはプロジェクトサイトとして `rs256.net/actions/` に配信される。`base` を外すとアセットが 404 になる。

リポジトリ作成後に Settings > Pages > Source を **GitHub Actions** にする。

## 構成

```
src/
├── assets/lang/     言語辞書（YAML）。非 ASCII を許可する唯一のソース
├── core/            純粋 TypeScript。Vue に依存しない
│   ├── catalog.ts   アクションのバージョンなど、変化する定数
│   ├── generators/  AppState -> GeneratedFile[] の純粋関数
│   ├── yaml.ts      Document API 経由の文字列化とコメント挿入
│   └── comment.ts   コメントの折り返し（表示桁 100 / 簡易禁則処理）
├── composables/     リアクティブな状態と派生
├── components/      Vue SFC
└── styles/          tokens.css（本体からのコピー）+ Tailwind
```

**`core/` から Vue を import しない。** 生成ロジックを `AppState -> GeneratedFile[]` の純粋関数に保つことで、
DOM 無しでスナップショットテストが書けるようにしている。

## アクションのバージョン

生成物が使うアクションのメジャーバージョンは `src/core/catalog.ts` の `ACTION_VERSIONS` で一元管理している。
**Dependabot がこのリポジトリのワークフローを更新した際は、`ACTION_VERSIONS` も合わせて直す。**
`.github/` 以下は生成物なので、ワークフローだけを書き換える PR はドッグフーディングのテストで落ちる。
直すべきは常に `ACTION_VERSIONS` の側。

## 依存関係で保留しているもの

- **TypeScript 7 は入れられない。** TS 7 は `./lib/tsc` を exports から外したが、`vue-tsc` は
  これを `require.resolve` するため、`npm run build`（`vue-tsc -b`）が `ERR_PACKAGE_PATH_NOT_EXPORTED`
  で落ちる。vue-tsc 3.2.8 と最新の 3.3.8 の両方で確認済み。Volar 側が TS 7 に対応するまで `~6.0.2` で止める。
  PR が届かないよう `dogfood.test.ts` の `state.dependabot.ignore` で typescript のメジャー更新だけを
  ignore している。解消したらこの 1 行を消す（他の依存のメジャー更新は従来どおり届く）

## ドッグフーディング

`.github/` 以下の 3 ファイルは、このツールが生成したものをそのまま置いている。
`src/core/__tests__/dogfood.test.ts` が「コミットされている内容 == 現在の生成結果」を検証する。
生成器を意図的に変更したときは、該当ファイルを削除してから `npm test` を実行すると書き直される。

## デザイントークン

`src/styles/tokens.css` は本体サイト `RS-256.github.io` の `src/styles/tokens.css` のコピー。

- コピー元: `RS-256.github.io` / `src/styles/tokens.css`
- 取得時点: 2026-07-25
- **このファイルは直接編集しない。** 本体側が変わったら再コピーする

`--cat-*`（作品カテゴリ色）のうち 3 組を、このツールの info / warning / success バナーに転用している
（`src/styles/global.css` の `@theme inline`）。

ダークテーマは `<html>` の `.dark` クラスで切り替わり、`localStorage` の `theme` キーを本体サイトと共有する
（同一オリジンのため）。テーマの設定は両サイト間で引き継がれる。

## 文字コード規約

**手で書くソースコードは ASCII 文字のみで記述する。** 例外は `scripts/check-ascii.mjs` の allowlist にある
5 種類（言語辞書 / `docs/` / README / 生成物の `.github/**/*.yml` / スナップショット）と `LICENSE` だけ。

UI に出る文字列を直書きできないため、この規約がそのまま i18n の徹底を強制する。
文言を追加するときは `src/assets/lang/en_us.yaml` と `ja_jp.yaml` の両方に入れる（キー集合の一致はテストで検証）。

## Biome の例外

`biome.json` で 3 つのルールを外している。理由は以下のとおり。

| ルール | 対象 | 理由 |
|---|---|---|
| `suspicious/noTemplateCurlyInString` | 全体 | `${{ ... }}` は GitHub の式構文であり、このツールの出力そのもの |
| `correctness/noUnusedImports` / `noUnusedVariables` | `*.vue` | Biome は `<template>` 内の参照を追えないため誤検知になる（型は `vue-tsc` で見る） |
| `complexity/noImportantStyles` | `src/styles/*.css` | Shiki がインラインで付ける背景色を打ち消すのに必要 |

## 未了

- `public/ogp.png`（このツール専用の OGP 画像）。用意できていないため `index.html` の `og:image` は未設定
- 本体サイトの `src/content/works.yaml` に `category: web-tools` でエントリを追加する

## ライセンス

MIT

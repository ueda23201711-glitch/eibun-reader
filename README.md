# 英文リーダー

英文を貼り付けると、英語の読み上げ・文ごとの日本語訳・単語をタップして辞書・熟語の表示ができ、単語や熟語を My単語帳（kiku-my）に保存できます。
https://ueda23201711-glitch.github.io/eibun-reader/

- iPad 2/3（iOS 9）でも動くよう ES5 だけで書いています。
- 合言葉は手書きメモ・単語帳と共通（Firebase の memos/合言葉/reader, settings/gas, myvocab）。
- 辞書：EJDict-hand（パブリックドメイン / CC0, `vendor/ejdict/`）。熟語リスト（phrases.json の前半）はこのアプリ用に作成。
- 日本語訳：利用者自身の Google Apps Script（LanguageApp）。

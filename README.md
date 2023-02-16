# Exhaustive-Twitter-Tools

## histogram-hashtag

* 実装：横山
* 概要：ハッシュタグの數を数え上げる。
* 使い方：Tweetの格納されたtar.gzファイルを解答してできたディレクトリ内で以下のコマンドを実行
  * 例：頻出ハッシュタグ上位10件をコンソール上に表示（厳密解）

```
npx -y -p exhaustive-twitter-tools@latest histogram-hashtag
```

* オプション
```
Usage: histogram-hashtag [options]

Options:
  -t, --top <k>           Show Top-K (default: 10)
  -a, --algo <algorithm>  Exact, Cutoff, or Approximate solution (choices: "approx", "cutoff", "exact", default: "exact")
  -f, --format <type>     Output file type (choices: "json", "csv", default: "csv")
  -o, --out <filename>    Output file name (default: "stdout")
  -h, --help              display help for command
```

* 解説
    * **-t**: 上位何件を表示するか？
    * **-a**: 厳密階(exact)はメモリ消費量が大きい。これで無理な場合は下位無視(cutoff)もしくは、近似アルゴリズム(approx)を指定する
      * **cutoff**は１ファイル走査終了毎に再頻出タグの出現数の1%に満たないエントリを結果から除外する。
    * **-f**: 結果の形式をjsonかcsvから選ぶ
    * **-o**: 出力ファイルの名前。デフォルトではファイルではなく標準出力に出力する。
* 高度な例
  * 頻出タグ上位50件を各Tweetファイルcutoffした上でjson形式でoutput.txtへ出力する。

```
npx -y -p exhaustive-twitter-tools@latest histogram-hashtag -t 50 -a cutoff -f json -o output.txt
```
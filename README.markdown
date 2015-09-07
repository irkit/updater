IRKit Updater
=============

[IRKit Updater](https://github.com/irkit/updater) は、[IRKit](http://getirkit.com/) のファームウェア(内部のソフトウェア)をアップデートするための、アプリケーション。

## 動作環境

- Mac OSX 10.8以降
- Windows 7以降

## 使用方法

1. [最新のIRKit Updaterをダウンロード](https://github.com/irkit/updater/releases/latest)
1. ダウンロードしたzipファイルを展開
1. IRKitをUSBケーブルを使ってコンピューターに接続
1. Windowsをお使いの場合には、IRKitのドライバをインストール (Macをお使いの場合は必要ありません)
    1. 管理者としてログインします
    1. Windows 7, 8 の場合
        1. スタート メニューから、コントロール パネル、システムとセキュリティ、の順にクリックし、システム の下の デバイス マネージャー をクリックします
        1. ほかのデバイス の下に IRKit が表れるので、IRKit を右クリック
        1. ドライバーソフトウェアの更新、コンピューターを参照してドライバー ソフトウェアを検索します、 を順にクリック
        1. 次の場所でドライバー ソフトウェアを検索します の下にある参照ボタンをクリックし、IRKit Updaterを解凍したフォルダを選択
        1. サブフォルダーも検索する、にチェックをつけ、次へ をクリック
        1. ドライバー ソフトウェアの発行元を検証できません、と表示されたら このドライバー ソフトウェアをインストールします をクリック
    1. Windows 8.1 の場合
        1. スタート メニューから、PC設定、保守と管理、回復、を順にクリックし、PCの起動をカスタマイズする の下にある 今すぐ再起動する をクリックします
        1. 再起動後、トラブルシューティング、詳細オプション、スタートアップ設定、再起動、を順にクリックします
        1. スタートアップ設定 が表示されたら、7 を押す
        1. デスクトップの右下に テストモード と表示されます
        1. スタート メニューから、PC設定、コントロール パネル、システムとセキュリティ、システム、デバイス マネージャーを順にクリックします
        1. ほかのデバイス の下に IRKit が表れるので、IRKit を右クリック
        1. ドライバーソフトウェアの更新、コンピューターを参照してドライバー ソフトウェアを検索します、 を順にクリック
        1. 次の場所でドライバー ソフトウェアを検索します の下にある参照ボタンをクリックし、IRKit Updaterを解凍したフォルダを選択
        1. サブフォルダーも検索する、にチェックをつけ、次へ をクリック
        1. ドライバー ソフトウェアの発行元を検証できません、と表示されたら このドライバー ソフトウェアをインストールします をクリック
1. IRKit Updater を実行  
   Macの場合は "IRKit Updater.app" をダブルクリック、Windowsの場合は "IRKit Updater.exe" をダブルクリックしてください。
   * Windows 8.1 の場合、WindowsによってPCが保護されました、というダイアログが表れる場合があります。  
     この場合には、このダイアログ上の、詳細情報、実行、を順にクリックして実行してください。
1. 以下のように表示されるので Update をクリック  
<a data-flickr-embed="true" data-header="false" data-footer="false" data-context="false"  href="https://www.flickr.com/photos/maaash/20891451740/in/dateposted/" title="スクリーンショット 2015-09-02 15.54.33"><img src="https://farm6.staticflickr.com/5634/20891451740_df829ef82e_z.jpg" width="640" height="499" alt="スクリーンショット 2015-09-02 15.54.33"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>
1. Log areaに進行状況が詳しく表示されます。その後最後に以下のように表示されれば成功
<a data-flickr-embed="true" data-header="false" data-footer="false" data-context="false"  href="https://www.flickr.com/photos/maaash/21053384776/in/dateposted/" title="スクリーンショット 2015-09-02 16.01.47"><img src="https://farm1.staticflickr.com/612/21053384776_c7b408988a_z.jpg" width="640" height="499" alt="スクリーンショット 2015-09-02 16.01.47"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>
1. うまくいかなければ、画面の指示にしたがい再度IRKitを抜き差ししてやり直し、それでもうまくいかなければ Log area 右上の Copy をクリックして、以下のサポートメール support@getirkit.com 宛に、本文に貼り付けて送ってください。

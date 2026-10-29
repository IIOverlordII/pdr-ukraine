"""ПДР України — окрема програма для Windows.

Відкриває застосунок з теки app/ у власному вікні (рушій Microsoft Edge WebView2).
Прогрес зберігається в %APPDATA%\\PDR-Ukraine.
"""
import os
import sys

import webview


def resource(*parts):
    # у зібраному .exe файли розпаковуються в sys._MEIPASS
    base = getattr(sys, '_MEIPASS', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    return os.path.join(base, *parts)


def main():
    storage = os.path.join(os.environ.get('APPDATA') or os.path.expanduser('~'), 'PDR-Ukraine')
    os.makedirs(storage, exist_ok=True)
    webview.create_window('ПДР України', url=resource('app', 'index.html'),
                          width=1240, height=860, min_size=(420, 600), background_color='#F4F6FA')
    webview.start(private_mode=False, storage_path=storage)


if __name__ == '__main__':
    main()

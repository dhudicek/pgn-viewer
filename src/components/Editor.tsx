import React from 'react';
import Chess from 'chess.js';
import MyChessground from './MyChessground.js';
import { EditorKit, EditorKitDelegate } from 'sn-editor-kit';
import './styles/chessground.css';
import './styles/chessground-theme.css';
// import { Col, Modal } from "antd"

export enum HtmlElementId {
  snComponent = 'sn-component',
  textarea = 'textarea',
}

export enum HtmlClassName {
  snComponent = 'sn-component',
  textarea = 'sk-input contrast textarea',
}

export interface EditorInterface {
  printUrl: boolean;
  text: string;
}

const test_pgn = [
  '[Event "Casual Game"]',
  '[Site "Berlin GER"]',
  '[Date "1852.??.??"]',
  '[EventDate "?"]',
  '[Round "?"]',
  '[Result "1-0"]',
  '[White "Adolf Anderssen"]',
  '[Black "Jean Dufresne"]',
  '[ECO "C52"]',
  '[WhiteElo "?"]',
  '[BlackElo "?"]',
  '[PlyCount "47"]',
  '',
  '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O',
  'd3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4',
  'Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6',
  'Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8',
  '23.Bd7+ Kf8 24.Bxe7# 1-0',
].join('\n');

const test2_pgn = [
  '[Event "Casual Game"]',
  '[Site "Berlin GER"]',
  '[Date "1852.??.??"]',
  '[EventDate "?"]',
  '[Round "?"]',
  '[Result "1-0"]',
  '[White "Adolf Anderssen"]',
  '[Black "Jean Dufresne"]',
  '[ECO "C52"]',
  '[WhiteElo "?"]',
  '[BlackElo "?"]',
  '[PlyCount "47"]',
  '',
  '1.e4 e5',
].join('\n');

const initialState = {
  printUrl: false,
  text: test2_pgn,
};

let keyMap = new Map();

export default class Editor extends React.Component<{}, EditorInterface> {
  editorKit: any;
  lastMove: any;
  pendingMove: any;
  selectVisible: boolean;
  from: any;
  to: any;
  chess: any;

  constructor(props: EditorInterface) {
    super(props);
    this.configureEditorKit();
    this.state = initialState;
    this.chess = new Chess();
    if (this.chess.load_pgn(this.state.text)) {
      console.log('successful load' + this.state.text);
    } else {
      console.log('failed load' + this.state.text);
    }
    this.selectVisible = false;
  }

  configureEditorKit = () => {
    let delegate = new EditorKitDelegate({
      /** This loads every time a different note is loaded */
      setEditorRawText: (text: string) => {
        this.setState({
          ...initialState,
          text,
        });
      },
      clearUndoHistory: () => {},
      getElementsBySelector: () => [],
    });

    this.editorKit = new EditorKit({
      delegate: delegate,
      mode: 'plaintext',
      supportsFilesafe: false,
    });
  };

  handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = event.target;
    const value = target.value;
    this.saveText(value);
  };

  saveText = (text: string) => {
    this.saveNote(text);
    this.setState({
      text: text,
    });
  };

  saveNote = (text: string) => {
    /** This will work in an SN context, but breaks the standalone editor,
     * so we need to catch the error
     */
    try {
      this.editorKit.onEditorValueChanged(text);
    } catch (error) {
      console.log('Error saving note:', error);
    }
  };

  onBlur = (e: React.FocusEvent) => {};

  onFocus = (e: React.FocusEvent) => {};

  onKeyDown = (e: React.KeyboardEvent | KeyboardEvent) => {
    keyMap.set(e.key, true);
    // Do nothing if 'Control' and 's' are pressed
    if (keyMap.get('Control') && keyMap.get('s')) {
      e.preventDefault();
    }
  };

  onKeyUp = (e: React.KeyboardEvent | KeyboardEvent) => {
    keyMap.delete(e.key);
  };

  setPendingMove = ([from, to]: [any, any]) => {
    this.pendingMove = [from, to];
  };

  turnColor = () => {
    console.log('turn color calc' + this.chess.turn());
    return this.chess.turn() === 'w' ? 'white' : 'black';
  };

  calcMovable = () => {
    // console.log("calc movable")
    const dests = new Map();
    this.chess.SQUARES.forEach((s: any) => {
      const ms = this.chess.moves({ square: s, verbose: true });
      if (ms.length)
        dests.set(
          s,
          ms.map((m: any) => m.to)
        );
    });
    // console.log(dests)
    return {
      free: false,
      dests,
      color: this.turnColor(),
    };
  };

  onMove = (from: any, to: any) => {
    console.log('on move');
    const moves = this.chess.moves({ verbose: true });
    for (let i = 0, len = moves.length; i < len; i++) {
      /* eslint-disable-line */
      if (moves[i].flags.indexOf('p') !== -1 && moves[i].from === from) {
        this.setPendingMove([from, to]);
        this.selectVisible = true;
        return;
      }
    }
    if (this.chess.move({ from, to, promotion: 'x' })) {
      // this.fen = this.chess.fen();

      this.lastMove = [from, to];
    }
    this.setState({
      text: this.chess.pgn(),
    });
  };

  getFen = () => {
    return this.chess.fen();
  };

  render() {
    const { text } = this.state;
    return (
      <div
        className={
          HtmlElementId.snComponent + (this.state.printUrl ? ' print-url' : '')
        }
        id={HtmlElementId.snComponent}
        tabIndex={0}
      >
        <MyChessground
          width="38vw"
          height="38vw"
          turnColor={this.turnColor()}
          movable={this.calcMovable()}
          lastMove={this.lastMove}
          fen={this.getFen()}
          onMove={this.onMove}
          style={{ margin: 'auto' }}
        />
        <p>{text}</p>
        <p>{this.getFen()}</p>
      </div>
    );
  }
}

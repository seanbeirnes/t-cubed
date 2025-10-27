export type MoveRecord = {
    move_event: MoveEvent;
    trace: Trace | null;
}

type MoveEvent = {
  move_sequence: number;
  player_id: number;
  post_move_state: string;
}

type Trace = {
  layerOutputs: number[][];
}

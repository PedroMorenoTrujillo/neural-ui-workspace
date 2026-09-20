import type {
  NeuTableDataRequest,
  NeuTableMetadata,
  NeuTableQuery,
} from '../../projects/ui-core/table/next/public/public-api';
import { query, type AccountField } from './model';

export interface RemoteConsumerState {
  readonly query: NeuTableQuery<AccountField>;
  readonly metadata: NeuTableMetadata;
}

export function acceptQueryProposal(
  state: RemoteConsumerState,
  next: NeuTableQuery<AccountField>,
): RemoteConsumerState {
  return {
    query: next,
    metadata: { ...state.metadata, queryRevision: state.metadata.queryRevision + 1 },
  };
}

export function transportDataRequest(request: NeuTableDataRequest<AccountField>): string {
  const range = request.range ? `&start=${request.range.start}&end=${request.range.end}` : '';
  return `/accounts?page=${request.query.page}&request=${request.requestId}${range}`;
}

export const remoteState: RemoteConsumerState = {
  query,
  metadata: {
    totalItems: 4_200,
    loading: false,
    error: null,
    queryRevision: 7,
    appliedRequestId: 41,
    dataRange: { start: 0, end: 25 },
  },
};

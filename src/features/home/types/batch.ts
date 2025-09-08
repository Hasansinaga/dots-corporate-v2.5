export interface BatchUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface TransactionBatch {
  id: string;
  unique_code_cbs: string;
  unique_code_mbcorp: string;
  created_by: BatchUser;
  created_at: string;
  status: number;
  settled_at: string | null;
  settled_by: BatchUser | null;
  branch_id: string;
  is_active: boolean;
  core_trx_group_id: string;
}

export interface BatchResponse {
  data: TransactionBatch[];
  total: number;
  offset: number;
  limit: number;
}

export interface CreateBatchRequest {
  id: string;
  created_by: number;
  created_at: string;
  status: number;
  branch_id: string;
  is_active: boolean;
  core_trx_group_id: string;
}

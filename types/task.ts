export interface Task {
  id: string;
  title: string;
  parentId: string | null;
  position: number;
  teamId: string | null;
  isDeleted: boolean;
  createdAt: string | Date | null;
}

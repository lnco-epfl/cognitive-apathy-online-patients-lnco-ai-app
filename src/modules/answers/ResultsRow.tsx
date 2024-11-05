import { FC } from 'react';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { IconButton } from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { BoundsType, DelayType, RewardType } from '../experiment/utils/types';

export type ResultData = {
  name: string | undefined;
  delays?: DelayType[];
  rewards?: RewardType[];
  bounds?: BoundsType[];
  length: number;
  rawDataDownload: () => void;
};

const ResultsRow: FC<ResultData> = ({
  name,
  delays,
  rewards,
  bounds,
  length,
  rawDataDownload,
}) => (
  <TableRow>
    <TableCell>{name}</TableCell>
    <TableCell>{delays?.toString()}</TableCell>
    <TableCell>{rewards?.toString()}</TableCell>
    <TableCell>{bounds?.toString()}</TableCell>
    <TableCell>{length}</TableCell>
    <TableCell>
      <IconButton
        onClick={(): void => {
          rawDataDownload();
        }}
      >
        <FileDownloadIcon />
      </IconButton>
    </TableCell>
  </TableRow>
);

export default ResultsRow;

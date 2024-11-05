import { FC } from 'react';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Button } from '@mui/material';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { format } from 'date-fns';
import { DataCollection } from 'jspsych';

import { hooks } from '@/config/queryClient';

import { ExperimentResult } from '../config/appResults';
import ResultsRow from './ResultsRow';

const downloadJson: (json: string, filename: string) => void = (
  json: string,
  filename: string,
): void => {
  const blob = new Blob([json], { type: 'application/json' }); // Create a blob from the string
  const url = URL.createObjectURL(blob); // Create a URL for the blob
  const anchor: HTMLAnchorElement = document.createElement('a');
  anchor.setAttribute('hidden', '');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const ResultsView: FC = () => {
  const { data: appData } = hooks.useAppData<ExperimentResult>();

  const allData = (): string => {
    const completeJSON: string[] = [];
    appData?.forEach((data) => {
      const experimentJSON = data.data.rawData
        ? new DataCollection(data.data.rawData.trials)
        : undefined;
      if (experimentJSON) {
        completeJSON.push(experimentJSON.json());
      }
    });
    return `[${completeJSON.toString()}]`;
  };

  return (
    <Stack spacing={2}>
      <Stack justifyContent="space-between" direction="row">
        <Typography variant="h3">Results</Typography>
        <Button
          variant="text"
          onClick={() => {
            downloadJson(
              allData(),
              `numerosity_all_${format(new Date(), 'yyyyMMdd_HH.mm')}.json`,
            );
          }}
        >
          <FileDownloadIcon />
          Export All
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table
          sx={{ minWidth: 650, textAlign: 'center' }}
          aria-label="answers table"
        >
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Delays</TableCell>
              <TableCell>Rewards</TableCell>
              <TableCell>Bounds</TableCell>
              <TableCell>jsPsych Data Size</TableCell>
              <TableCell>Export</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appData?.map((data) => {
              const rawData = data.data.rawData
                ? new DataCollection(data.data.rawData.trials)
                : undefined;
              return (
                <ResultsRow
                  key={data.id}
                  name={data.creator?.name}
                  delays={data.data.settings?.taskSettings.taskBlocksIncluded}
                  rewards={data.data.settings?.taskSettings.taskRewardsIncluded}
                  bounds={data.data.settings?.taskSettings.taskBoundsIncluded}
                  length={rawData ? rawData.count() : 0}
                  rawDataDownload={() =>
                    downloadJson(
                      rawData ? rawData.json() : '[]',
                      `numerosity_${data.creator?.name}_${data.updatedAt}_${format(new Date(), 'yyyyMMdd_HH.mm')}.json`,
                    )
                  }
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default ResultsView;

import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface ProcessingAnalysisProps {
  totalFiles: number;
  completed: number;
  processing: number;
  failed: number;
  queued: number;
}

export const ProcessingAnalysis = ({
  totalFiles,
  completed,
  processing,
  failed,
  queued,
}: ProcessingAnalysisProps) => {
  // Calculate progress percentage including processing files
  const progressPercentage = totalFiles
    ? ((completed + processing) / totalFiles) * 100
    : 0;

  // Calculate rates based on completed files
  const completedTotal = completed + failed;
  const successRate = completedTotal
    ? ((completed / completedTotal) * 100).toFixed(1)
    : "0.0";
  const failureRate = completedTotal
    ? ((failed / completedTotal) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-700 ease-in-out"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: completed === totalFiles ? "#22C55E" : "#3B82F6",
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mt-4">
        <div className="p-4 rounded-lg text-center bg-gray-50/50">
          <div className="text-2xl font-semibold text-gray-700">
            {totalFiles}
          </div>
          <div className="text-sm text-gray-600">Total Files</div>
        </div>

        <div className="p-4 rounded-lg text-center bg-green-50/50">
          <div className="text-2xl font-semibold text-green-600">
            {completed}
          </div>
          <div className="text-sm text-green-600">Completed</div>
        </div>

        <div className="p-4 rounded-lg text-center bg-blue-50/50">
          <div className="text-2xl font-semibold text-blue-600">
            {processing}
          </div>
          <div className="text-sm text-blue-600">Processing</div>
        </div>

        <div className="p-4 rounded-lg text-center bg-red-50/50">
          <div className="text-2xl font-semibold text-red-600">{failed}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>

        <div className="p-4 rounded-lg text-center bg-yellow-50/50">
          <div className="text-2xl font-semibold text-yellow-600">{queued}</div>
          <div className="text-sm text-yellow-600">Queued</div>
        </div>
      </div>

      {/* Rates */}
      {completedTotal > 0 && (
        <div className="flex gap-8 mt-4 text-sm text-gray-600">
          <div>Success Rate: {successRate}%</div>
          <div>Failure Rate: {failureRate}%</div>
        </div>
      )}
    </div>
  );
};

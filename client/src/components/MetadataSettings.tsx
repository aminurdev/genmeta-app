import { useState, useEffect } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

interface MetadataSettingsProps {
  onSave: (settings: {
    titleLength: number;
    descriptionLength: number;
    keywordsCount: number;
    helpText: string;
  }) => void;
  initialSettings: {
    titleLength: number;
    descriptionLength: number;
    keywordsCount: number;
    helpText: string;
  };
}

export const MetadataSettings = ({
  onSave,
  initialSettings,
}: MetadataSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  // Reset settings to initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  const handleSave = () => {
    onSave(settings);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 bg-[#2563EB] text-white rounded-md hover:bg-[#1D4ED8] transition-colors"
      >
        <Cog6ToothIcon className="h-5 w-5 mr-2" />
        Metadata Settings
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-full mx-4">
            <h2 className="text-xl font-semibold mb-6">Metadata Settings</h2>

            <div className="space-y-6">
              {/* Title Length */}
              <div>
                <label className="block mb-2">Title Length (characters)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={settings.titleLength}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        titleLength: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="w-10 text-right">
                    {settings.titleLength}
                  </span>
                </div>
              </div>

              {/* Description Length */}
              <div>
                <label className="block mb-2">
                  Description Length (characters)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={settings.descriptionLength}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        descriptionLength: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="w-10 text-right">
                    {settings.descriptionLength}
                  </span>
                </div>
              </div>

              {/* Keywords Count */}
              <div>
                <label className="block mb-2">Keywords Count</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={settings.keywordsCount}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        keywordsCount: parseInt(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="w-10 text-right">
                    {settings.keywordsCount}
                  </span>
                </div>
              </div>

              {/* Help Text */}
              <div>
                <label className="block mb-2">Help Text (Optional)</label>
                <textarea
                  value={settings.helpText}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      helpText: e.target.value,
                    }))
                  }
                  placeholder="Add any helpful context about the image to assist in generating better metadata. For example: 'This is a watercolor illustration of pomegranates in red and pink tones.'"
                  className="w-full h-32 p-2 border rounded-lg resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Provide additional context to help generate more accurate
                  metadata. This is optional but can improve results.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

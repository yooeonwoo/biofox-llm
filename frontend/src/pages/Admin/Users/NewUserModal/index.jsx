import React, { useState } from "react";
import { X } from "@phosphor-icons/react";
import Admin from "@/models/admin";
import { userFromStorage } from "@/utils/request";
import { MessageLimitInput, RoleHintDisplay } from "..";

export default function NewUserModal({ closeModal }) {
  const [error, setError] = useState(null);
  const [role, setRole] = useState("default");
  const [messageLimit, setMessageLimit] = useState({
    enabled: false,
    limit: 10,
  });
  const [enableMem0, setEnableMem0] = useState(true);

  const handleCreate = async (e) => {
    setError(null);
    e.preventDefault();
    const data = {};
    const form = new FormData(e.target);
    for (var [key, value] of form.entries()) data[key] = value;
    data.dailyMessageLimit = messageLimit.enabled ? messageLimit.limit : null;
    data.enable_mem0 = enableMem0;

    const { user, error } = await Admin.newUser(data);
    if (!!user) window.location.reload();
    setError(error);
  };

  const user = userFromStorage();

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border">
        <div className="relative p-6 border-b rounded-t border-theme-modal-border">
          <div className="w-full flex gap-x-2 items-center">
            <h3 className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap">
              Add user to instance
            </h3>
          </div>
          <button
            onClick={closeModal}
            type="button"
            className="absolute top-4 right-4 transition-all duration-300 bg-transparent rounded-lg text-sm p-1 inline-flex items-center hover:bg-theme-modal-border hover:border-theme-modal-border hover:border-opacity-50 border-transparent border"
          >
            <X size={24} weight="bold" className="text-white" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreate}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                  placeholder="User's username"
                  minLength={2}
                  required={true}
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-white/60">
                  Username must only contain lowercase letters, periods,
                  numbers, underscores, and hyphens with no spaces
                </p>
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Password
                </label>
                <input
                  name="password"
                  type="text"
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                  placeholder="User's initial password"
                  required={true}
                  autoComplete="off"
                  minLength={8}
                />
                <p className="mt-2 text-xs text-white/60">
                  Password must be at least 8 characters long
                </p>
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Bio
                </label>
                <textarea
                  name="bio"
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                  placeholder="User's bio"
                  autoComplete="off"
                  rows={3}
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Role
                </label>
                <select
                  name="role"
                  required={true}
                  defaultValue={"default"}
                  onChange={(e) => setRole(e.target.value)}
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                >
                  <option value="default">Default</option>
                  <option value="manager">Manager</option>
                  {user?.role === "admin" && (
                    <option value="admin">Administrator</option>
                  )}
                </select>
                <RoleHintDisplay role={role} />
              </div>
              <MessageLimitInput
                role={role}
                enabled={messageLimit.enabled}
                limit={messageLimit.limit}
                updateState={setMessageLimit}
              />
              <div className="mt-4 mb-8">
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-center gap-x-2">
                    <h2 className="text-base leading-6 font-bold text-white">
                      Enable Mem0 Memory
                    </h2>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={enableMem0}
                        onChange={(e) => setEnableMem0(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="pointer-events-none peer h-6 w-11 rounded-full bg-[#CFCFD0] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:shadow-xl after:border-none after:bg-white after:box-shadow-md after:transition-all after:content-[''] peer-checked:bg-[#32D583] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-transparent"></div>
                    </label>
                  </div>
                  <p className="text-xs leading-[18px] font-base text-white/60">
                    Allow this user to use Mem0 memory system for personalized conversation history and context.
                  </p>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">Error: {error}</p>}
              <p className="text-white text-xs md:text-sm">
                After creating a user they will need to login with their initial
                login to get access.
              </p>
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-theme-modal-border">
              <button
                onClick={closeModal}
                type="button"
                className="transition-all duration-300 text-white hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="transition-all duration-300 bg-white text-black hover:opacity-60 px-4 py-2 rounded-lg text-sm"
              >
                Add user
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

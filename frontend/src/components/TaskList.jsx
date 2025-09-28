import React, { useState, useEffect } from "react";
import axios from "axios";

const TaskList = ({ onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("pending");
  const [file, setFile] = useState(null);
  const [attachmentId, setAttachmentId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: "", image: null });

  useEffect(() => {
    fetchTasks();
    fetchUserProfile();
  }, []);

 
  const fetchUserProfile = async () => {
  try {
    const profileRes = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    let imageSrc = null;
    if (profileRes.data.images && profileRes.data.images[0]) {
      const imageRes = await axios.get(
        `${process.env.REACT_APP_API_URL}${profileRes.data.images[0].url}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );
      const blob = new Blob([imageRes.data], { type: imageRes.headers["content-type"] });
      imageSrc = URL.createObjectURL(blob);
    }

    setUserProfile({ name: profileRes.data.name, image: imageSrc });
  } catch (err) {
    console.error(err);
    if (err.response?.status === 401) onLogout();
  }
};


  useEffect(() => {
    return () => {
      if (userProfile.image) URL.revokeObjectURL(userProfile.image);
    };
  }, [userProfile.image]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!title) {
      setMessage("Please enter a task title");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("status", status);
    if (file) formData.append("attachment", file);
    if (attachmentId) formData.append("attachmentId", attachmentId);

    try {
      let res;
      if (editingId) {
        res = await axios.put(
          `${process.env.REACT_APP_API_URL}/tasks/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const attachmentsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/tasks/${editingId}/attachments`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const updatedTask = { ...res.data, attachments: attachmentsRes.data };
        setTasks(tasks.map((t) => (t._id === editingId ? updatedTask : t)));
      } else {
        res = await axios.post(
          `${process.env.REACT_APP_API_URL}/tasks`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const attachmentsRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/tasks/${res.data._id}/attachments`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const newTask = { ...res.data, attachments: attachmentsRes.data };
        setTasks([...tasks, newTask]);
      }

      setMessage("Task saved successfully");
      setMessageType("success");
      setTitle("");
      setStatus("pending");
      setFile(null);
      setAttachmentId(null);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data.message || "Error processing task");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (task) => {
    setTitle(task.title);
    setStatus(task.status);
    setEditingId(task._id);
    setFile(null);
    setAttachmentId(null);
    setMessage("");
  };

  const handleEditAttachment = (attachment) => {
    setAttachmentId(attachment._id);
    setMessage("Select a new file to update the attachment");
    setMessageType("info");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    setIsLoading(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTasks(tasks.filter((t) => t._id !== id));
      setMessage("Task deleted successfully");
      setMessageType("success");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data.message || "Error deleting task");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const Attachment = ({ attachment }) => {
    const [src, setSrc] = useState(null);
    const [isLoadingAttachment, setIsLoadingAttachment] = useState(true);
    const [error, setError] = useState(null);
    const objectUrlRef = React.useRef(null);

    useEffect(() => {
      const fetchAttachment = async () => {
        if (!attachment || !attachment._id) return;
        try {
          setIsLoadingAttachment(true);
          setError(null);
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/tasks/attachment/${attachment._id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              responseType: "blob",
            }
          );
          const blob = new Blob([response.data], { type: attachment.mimetype });
          const objectUrl = URL.createObjectURL(blob);

          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = objectUrl;
          setSrc(objectUrl);
        } catch (err) {
          console.error(err);
          setError("Failed to load attachment");
        } finally {
          setIsLoadingAttachment(false);
        }
      };

      fetchAttachment();
      return () => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      };
    }, [attachment]);

    if (!attachment || !attachment._id) return null;
    const ext = attachment.filename.split(".").pop().toLowerCase();
    if (isLoadingAttachment)
      return (
        <div className="w-full max-w-[200px] h-20 flex items-center justify-center">
          Loading...
        </div>
      );
    if (error)
      return (
        <div className="w-full max-w-[200px] h-48 bg-red-100 flex items-center justify-center">
          {error}
        </div>
      );

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return (
        <img
          src={src}
          alt={attachment.originalName}
          className="w-full max-w-[200px] h-auto rounded-md shadow-sm mt-2"
        />
      );
    } else if (ext === "pdf") {
      return (
        <object
          data={src}
          type="application/pdf"
          className="w-full rounded-md shadow-sm mt-2"
          style={{ height: "50vh" }}
        >
          <a href={src} download={attachment.originalName}>
            Download PDF
          </a>
        </object>
      );
    }
    return (
      <div className="w-full max-w-[200px] bg-gray-200 rounded-md shadow-sm mt-2 flex items-center justify-center">
        Unsupported file type
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md px-4 py-3 flex items-center justify-between z-10">
        <h1 className="text-lg font-bold text-gray-800">Task Manager</h1>
        <div className="flex items-center space-x-4">
          {userProfile.image ? (
            <img
              src={userProfile.image}
              alt={`${userProfile.name}`}
              className="w-10 h-10 rounded-full object-cover border border-[#e3e3e3] shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center border-2 border-blue-600 shadow-sm">
              <span className="text-white text-lg font-semibold">
                {userProfile.name ? userProfile.name[0].toUpperCase() : "?"}
              </span>
            </div>
          )}

          <span className="text-gray-700 text-base font-medium">
            {userProfile.name || "User"}
          </span>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 pt-20 pb-6 w-full max-w-3xl mx-auto px-2 sm:px-4">
        <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full mb-2 px-2 py-1 border rounded"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full mb-2 px-2 py-1 border rounded"
          >
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept="application/pdf,image/jpeg,image/png,image/gif"
            className="w-full mb-2"
          />
          {message && (
            <p
              className={
                messageType === "success"
                  ? "text-green-600"
                  : messageType === "info"
                  ? "text-blue-600"
                  : "text-red-600"
              }
            >
              {message}
            </p>
          )}
          <button
            onClick={handleCreateOrUpdate}
            disabled={isLoading}
            className="w-full py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading
              ? "Processing..."
              : editingId
              ? "Update Task"
              : "Create Task"}
          </button>
        </div>

        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task._id}
                className="bg-white p-3 rounded-md shadow-sm flex flex-col sm:flex-row sm:justify-between"
              >
                <div className="flex-1">
                  <span className="font-medium">{task.title}</span>{" "}
                  <span className="text-gray-500">({task.status})</span>
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="mt-2 w-20 flex flex-wrap gap-2">
                      <Attachment
                        key={task.attachments[task.attachments.length - 1]._id}
                        attachment={
                          task.attachments[task.attachments.length - 1]
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-center items-center space-x-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-3 py-1 bg-yellow-500 h-11 text-white rounded-md hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="px-3 py-1 h-11 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No tasks available.</p>
        )}
      </main>
    </div>
  );
};

export default TaskList;

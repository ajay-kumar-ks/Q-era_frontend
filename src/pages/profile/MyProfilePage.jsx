import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Avatar({ profile }) {
  const initials = profile?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full border border-slate-200 object-cover" />;
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
      {initials || "U"}
    </div>
  );
}

export default function MyProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [form, setForm] = useState({
    name: "",
    avatar_url: "",
    bio: "",
    preferred_topics: [],
    learning_goals: "",
    notification_preferences: { email: true, in_app: true, exam_reminders: true },
  });
  const [badges, setBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const getBadgeTheme = (badge) => {
    const name = (badge.name || "").toLowerCase();
    if (name.includes("milestone") || (badge.criteria_type === "exams_completed" && badge.criteria_value === 1)) {
      return {
        accent: "from-sky-500 to-indigo-500",
        glow: "rgba(29,158,117,0.35)",
        titleColor: "text-sky-300",
        descColor: "text-slate-400",
        hex: {
          shadow: "#04342C",
          main: "#0F6E56",
          band: "#085041",
          rim: "#1D9E75",
          label: "#5DCAA5",
          title: "#E1F5EE",
          pillBg: "#04342C",
          pillText: "#9FE1CB",
        },
        badgeLabel: "CERTIFIED",
        badgeTitle: "MILESTONE",
      };
    }
    if (name.includes("star") || (badge.criteria_type === "exams_completed" && badge.criteria_value > 1)) {
      return {
        accent: "from-violet-500 to-fuchsia-500",
        glow: "rgba(127,119,221,0.35)",
        titleColor: "text-violet-300",
        descColor: "text-slate-400",
        hex: {
          shadow: "#26215C",
          main: "#534AB7",
          band: "#3C3489",
          rim: "#7F77DD",
          label: "#AFA9EC",
          title: "#EEEDFE",
          pillBg: "#26215C",
          pillText: "#CECBF6",
        },
        badgeLabel: "ACHIEVEMENT",
        badgeTitle: "RISING STAR",
      };
    }
    if (name.includes("contributor") || badge.criteria_type === "questions_created") {
      return {
        accent: "from-orange-500 to-rose-500",
        glow: "rgba(216,90,48,0.35)",
        titleColor: "text-orange-300",
        descColor: "text-slate-400",
        hex: {
          shadow: "#4A1B0C",
          main: "#993C1D",
          band: "#712B13",
          rim: "#D85A30",
          label: "#F0997B",
          title: "#FAECE7",
          pillBg: "#4A1B0C",
          pillText: "#F5C4B3",
        },
        badgeLabel: "CONTRIBUTOR",
        badgeTitle: "QUESTION PRO",
      };
    }
    if (name.includes("score") || badge.criteria_type === "score_threshold") {
      return {
        accent: "from-amber-500 to-orange-500",
        glow: "rgba(234,179,8,0.35)",
        titleColor: "text-amber-300",
        descColor: "text-slate-400",
        hex: {
          shadow: "#4B2F00",
          main: "#C9730C",
          band: "#D97706",
          rim: "#F59E0B",
          label: "#FBBF24",
          title: "#FEF3C7",
          pillBg: "#4B2F00",
          pillText: "#FDE68A",
        },
        badgeLabel: "TOP SCORE",
        badgeTitle: "HIGH SCORE",
      };
    }
    return {
      accent: "from-violet-500 to-fuchsia-500",
      glow: "rgba(139,92,246,0.35)",
      titleColor: "text-violet-300",
      descColor: "text-slate-400",
      hex: {
        shadow: "#1F1B45",
        main: "#5B4FC0",
        band: "#433C8F",
        rim: "#8B5CF6",
        label: "#C4B5FD",
        title: "#F3E8FF",
        pillBg: "#1F1B45",
        pillText: "#DDD6FE",
      },
      badgeLabel: badge.name?.toUpperCase() || "ACHIEVED",
      badgeTitle: badge.criteria_type?.replaceAll("_", " ").toUpperCase() || "STATUS",
    };
  };

  const getBadgeNumber = (badge) => {
    if (badge.criteria_value != null) {
      return String(badge.criteria_value);
    }
    return `#${badge.id}`;
  };

  const renderBadgeSvg = (badge) => {
    const theme = getBadgeTheme(badge);
    const label = theme.badgeLabel;
    const title = theme.badgeTitle;

    return (
      <svg className="hex-svg h-[170px] w-[150px] transition-transform duration-300 group-hover:-translate-y-2" viewBox="0 0 130 150" xmlns="http://www.w3.org/2000/svg">
        <polygon points="65,4 124,37 124,113 65,146 6,113 6,37" fill={theme.hex.shadow} opacity="0.6" />
        <polygon points="65,8 120,39 120,111 65,142 10,111 10,39" fill={theme.hex.main} />
        <polygon points="65,44 112,69 112,101 65,126 18,101 18,69" fill={theme.hex.band} />
        <polygon points="65,8 120,39 120,47 65,18 10,47 10,39" fill={theme.hex.rim} opacity="0.45" />

        {badge.name?.toLowerCase().includes("milestone") && (
          <>
            <rect x="55" y="15" width="20" height="14" rx="3" fill={theme.hex.pillText} />
            <path d="M55,19 Q49,19 49,25 Q49,29 55,29" fill="none" stroke={theme.hex.pillText} strokeWidth="2" />
            <path d="M75,19 Q81,19 81,25 Q81,29 75,29" fill="none" stroke={theme.hex.pillText} strokeWidth="2" />
            <rect x="62" y="29" width="6" height="5" fill={theme.hex.pillText} />
            <rect x="58" y="34" width="14" height="3" rx="1" fill={theme.hex.pillText} />
          </>
        )}

        {badge.name?.toLowerCase().includes("star") && (
          <polygon
            points="65,13 68.5,22 78,22 70.5,27.5 73.5,37 65,31.5 56.5,37 59.5,27.5 52,22 61.5,22"
            fill={theme.hex.pillText}
          />
        )}

        {badge.name?.toLowerCase().includes("contributor") && (
          <g transform="translate(65,25) rotate(20)">
            <rect x="-5" y="-13" width="10" height="20" rx="2" fill={theme.hex.pillText} />
            <polygon points="-5,7 5,7 0,14" fill="#FAECE7" />
            <rect x="-5" y="-17" width="10" height="5" rx="1.5" fill={theme.hex.label} />
            <rect x="-1" y="-11" width="2" height="16" fill={theme.hex.rim} opacity="0.3" />
          </g>
        )}

        {badge.name?.toLowerCase().includes("score") && (
          <g transform="translate(65,30)">
            <circle cx="0" cy="0" r="10" fill={theme.hex.pillText} />
            <circle cx="0" cy="0" r="5" fill={theme.hex.label} />
            <path d="M-4,0 L0,-8 L4,0" stroke={theme.hex.rim} strokeWidth="2" fill="none" />
          </g>
        )}

        {(!badge.name?.toLowerCase().includes("milestone") && !badge.name?.toLowerCase().includes("star") && !badge.name?.toLowerCase().includes("contributor") && !badge.name?.toLowerCase().includes("score")) && (
          <text x="65" y="48" textAnchor="middle" fontFamily="Rajdhani, sans-serif" fontSize="32" fontWeight="700" fill={theme.hex.pillText}>{badge.name?.charAt(0).toUpperCase()}</text>
        )}

        <text x="65" y="60" textAnchor="middle" fontFamily="Rajdhani, sans-serif" fontSize="7.5" fontWeight="600" fill={theme.hex.label} letterSpacing="2">{label}</text>
        <text x="65" y="77" textAnchor="middle" fontFamily="Rajdhani, sans-serif" fontSize="13" fontWeight="700" fill={theme.hex.title} letterSpacing="1">{title}</text>
        <line x1="38" y1="82" x2="92" y2="82" stroke={theme.hex.rim} strokeWidth="0.6" opacity="0.6" />
        <rect x="45" y="88" width="40" height="13" rx="3" fill={theme.hex.pillBg} opacity="0.8" />
        <text x="65" y="98.5" textAnchor="middle" fontFamily="Rajdhani, sans-serif" fontSize="8" fontWeight="700" fill={theme.hex.pillText} letterSpacing="2">QERA</text>
      </svg>
    );
  };

  const getBadgeSummary = (badge) => {
    const amount = badge.criteria_value;
    switch (badge.criteria_type) {
      case "exams_completed":
        return `Completed ${amount} exam${amount === 1 ? "" : "s"}`;
      case "questions_created":
        return `Created ${amount} question${amount === 1 ? "" : "s"}`;
      case "score_threshold":
        return `Scored at least ${amount}% on an exam`;
      default:
        return amount != null ? `${badge.criteria_type?.replaceAll("_", " ")} • ${amount}` : badge.description;
    }
  };

  const formatBadgeDate = (value) => {
    if (!value) return "Unknown";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const isRemoteImage = (value) => typeof value === "string" && /^(https?:\/\/|data:image\/)/.test(value);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const response = await api.get("/users/me");
        const data = response.data;
        setProfile(data);
        setForm({
          name: data.name || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
          preferred_topics: data.preferred_topics || [],
          learning_goals: data.learning_goals || "",
          notification_preferences: {
            email: data.notification_preferences?.email ?? true,
            in_app: data.notification_preferences?.in_app ?? true,
            exam_reminders: data.notification_preferences?.exam_reminders ?? true,
          },
        });

        const badgesResponse = await api.get("/users/me/badges");
        setBadges(badgesResponse.data || []);
      } catch {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const addTopic = () => {
    const value = topicInput.trim().toLowerCase();
    if (!value || form.preferred_topics.includes(value)) return;
    setForm((prev) => ({ ...prev, preferred_topics: [...prev.preferred_topics, value] }));
    setTopicInput("");
  };

  const removeTopic = (topic) => {
    setForm((prev) => ({ ...prev, preferred_topics: prev.preferred_topics.filter((item) => item !== topic) }));
  };

  async function saveChanges(event) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put("/users/me", form);
      setProfile(response.data);
      await refreshUser();
      setEditing(false);
      setSuccess("Profile settings updated.");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save profile.");
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">Loading profile...</div>;
  }

  if (error && !profile) {
    return <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-rose-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar profile={profile} />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{profile?.name}</h1>
            <p className="text-sm text-slate-600">{profile?.email}</p>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">{profile?.bio || "No bio added yet."}</p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? "Cancel" : "Edit settings"}
        </button>
      </div>

      {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      {editing && (
        <form className="mb-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={saveChanges}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-avatar">Profile picture URL</label>
              <input
                id="profile-avatar"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={form.avatar_url}
                onChange={(event) => setForm((prev) => ({ ...prev, avatar_url: event.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-bio">Bio</label>
            <textarea
              id="profile-bio"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              rows={4}
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-goals">Learning goals</label>
            <textarea
              id="profile-goals"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              rows={3}
              value={form.learning_goals}
              onChange={(event) => setForm((prev) => ({ ...prev, learning_goals: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-topic">Preferred topics</label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                id="profile-topic"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={topicInput}
                onChange={(event) => setTopicInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTopic();
                  }
                }}
              />
              <button type="button" onClick={addTopic} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                Add topic
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.preferred_topics.map((topic) => (
                <button key={topic} type="button" onClick={() => removeTopic(topic)} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  #{topic} x
                </button>
              ))}
            </div>
          </div>

          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-700">Notification preferences</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["email", "Email"],
                ["in_app", "In-app"],
                ["exam_reminders", "Exam reminders"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.notification_preferences[key])}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        notification_preferences: { ...prev.notification_preferences, [key]: event.target.checked },
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
            Save settings
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Stats</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>Global Rank: {profile.stats.global_rank ?? "N/A"}</div>
            <div>Exams Attended: {profile.stats.exams_attended}</div>
            <div>Exams Created: {profile.stats.exams_created}</div>
            <div>Questions Created: {profile.stats.questions_created}</div>
            <div>Accuracy: {profile.stats.accuracy?.toFixed(1)}%</div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[36rem]">
          <h2 className="text-lg font-semibold">Achievements</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {badges.length > 0 ? (
              <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 justify-items-center">
                {badges.map((badge) => {
                  const theme = getBadgeTheme(badge);
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => setSelectedBadge(badge)}
                      className="group inline-flex min-h-[310px] w-full max-w-[260px] flex-col items-center gap-4 rounded-[2rem] border border-slate-200 bg-slate-950/5 p-6 text-center transition duration-300 hover:-translate-y-1 hover:bg-slate-950/10 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {renderBadgeSvg(badge)}
                      <div className="badge-info max-w-[180px] text-center">
                        <div className={`text-sm font-semibold ${theme.titleColor}`}>{badge.name}</div>
                        <div className={`mt-1 text-[11px] uppercase tracking-[0.24em] ${theme.descColor}`}>{theme.badgeTitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No badges earned yet. Take exams and engage with the app to unlock achievements.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Learning profile</h2>
          <p className="mt-3 text-sm text-slate-700">{profile.learning_goals || "No learning goals added yet."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile.preferred_topics || []).length ? profile.preferred_topics.map((topic) => (
              <span key={topic} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">#{topic}</span>
            )) : <span className="text-sm text-slate-500">No preferred topics yet.</span>}
          </div>
        </div>
      </div>

      {selectedBadge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 sm:px-6">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-4xl shadow-sm">
                  {selectedBadge.icon_url ? (
                    isRemoteImage(selectedBadge.icon_url) ? (
                      <img src={selectedBadge.icon_url} alt={selectedBadge.name} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <span>{selectedBadge.icon_url}</span>
                    )
                  ) : (
                    <span className="font-semibold text-slate-800">{selectedBadge.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedBadge.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{selectedBadge.description}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                onClick={() => setSelectedBadge(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Badge ID</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">#{selectedBadge.id}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Unlocked</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedBadge.unlocked_at ? formatBadgeDate(selectedBadge.unlocked_at) : "Pending"}</p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">How to earn</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{getBadgeSummary(selectedBadge)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{selectedBadge.criteria_type?.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {selectedBadge.description} {selectedBadge.criteria_value != null ? `This badge is awarded when you reach ${selectedBadge.criteria_value} ${selectedBadge.criteria_type?.replaceAll("_", " ")}.` : "Keep engaging to unlock more badges."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

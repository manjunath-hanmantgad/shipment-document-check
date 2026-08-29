import type { ActivityEntry } from "../domain/actions";

interface ActivityLogProps {
  activities: ActivityEntry[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  return (
    <section className="panel activity-panel" aria-label="Activity log">
      <div className="panel-heading compact">
        <div>
          <p className="section-kicker">Visible history</p>
          <h2>Activity</h2>
        </div>
        <span className="count-badge">{activities.length}</span>
      </div>
      {activities.length === 0 ? (
        <p className="empty-state">Actions performed in this session will appear here.</p>
      ) : (
        <ol className="activity-list">
          {activities.map((activity) => (
            <li key={activity.id}>
              <span className={`actor actor-${activity.actor}`}>
                {activity.actor}
              </span>
              <span>{activity.message}</span>
              <time dateTime={activity.timestamp}>
                {new Date(activity.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

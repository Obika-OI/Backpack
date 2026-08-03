import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { ScheduleEvent } from '../../types';
import { Calendar, Video, Plus, PhoneCall, StopCircle } from 'lucide-react';
import { ProctoringSession } from './ProctoringSession';

export const CourseSchedule = ({ courseId, isStudent }: { courseId: string, isStudent: boolean }) => {
    const { scheduleEvents, addScheduleEvent, updateScheduleEvent } = useAppContext();
    const courseEvents = scheduleEvents.filter(e => e.courseId === courseId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [durationMins, setDurationMins] = useState(60);
    const [type, setType] = useState<'lecture' | 'meeting' | 'exam'>('lecture');
    const [meetingUrl, setMeetingUrl] = useState("");
    
    // Stabilize Date.now() for render
    const [currentTime] = useState(() => Date.now());
    
    // Track which event has active proctoring
    const [activeProctoringId, setActiveProctoringId] = useState<string | null>(null);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const newEvent: ScheduleEvent = {
            id: `evt_${crypto.randomUUID()}`,
            courseId,
            title,
            date,
            time,
            durationMins: Number(durationMins),
            type,
            meetingUrl: meetingUrl.trim() || undefined,
            isActive: false
        };
        await addScheduleEvent(newEvent);
        setTitle("");
        setDate("");
        setTime("");
        setDurationMins(60);
        setMeetingUrl("");
    };

    const toggleVideoCall = async (evt: ScheduleEvent) => {
        await updateScheduleEvent(evt.id, { isActive: !evt.isActive });
    };

    return (
        <div className="space-y-8">
            {!isStudent && (
                <form onSubmit={handleCreateEvent} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-400" /> Schedule Class Event</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Week 1 Lecture" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                            <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Time</label>
                            <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (mins)</label>
                            <input required type="number" min={15} value={durationMins} onChange={e => setDurationMins(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                            <select value={type} onChange={e => setType(e.target.value as 'lecture' | 'meeting' | 'exam')} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                <option value="lecture">Lecture</option>
                                <option value="meeting">Meeting</option>
                                <option value="exam">Exam</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Meeting URL (Optional)</label>
                            <input type="url" value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="https://meet.google.com/..." />
                        </div>
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition w-full sm:w-auto flex items-center justify-center">
                        <Plus className="w-4 h-4 mr-2" /> Add to Timetable
                    </button>
                </form>
            )}

            <div>
                <h3 className="text-xl font-bold text-white mb-6">Class Timetable</h3>
                {courseEvents.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">No events scheduled.</div>
                ) : (
                    <div className="space-y-4">
                        {courseEvents.map(evt => {
                            const isPast = new Date(`${evt.date}T${evt.time}`).getTime() < currentTime;
                            return (
                                <div key={evt.id} className={`flex flex-col sm:flex-row p-5 rounded-xl border ${isPast ? 'bg-slate-900/30 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700'}`}>
                                    <div className="flex-shrink-0 w-24 mb-3 sm:mb-0 text-center sm:text-left">
                                        <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider">{new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                        <div className="text-white font-medium">{evt.time}</div>
                                        <div className="text-xs text-slate-500">{evt.durationMins} mins</div>
                                    </div>
                                    <div className="flex-grow pl-0 sm:pl-6 sm:border-l border-slate-700 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-bold text-lg text-white">{evt.title}</h4>
                                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] uppercase font-bold rounded-full border border-slate-700">{evt.type}</span>
                                            </div>
                                        </div>
                                        {evt.meetingUrl && (
                                            <div className="mt-3 flex flex-col gap-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {!isStudent && (
                                                        <button 
                                                            onClick={() => toggleVideoCall(evt)}
                                                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${evt.isActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                                        >
                                                            {evt.isActive ? (
                                                                <><StopCircle className="w-4 h-4 mr-2" /> End Video Call</>
                                                            ) : (
                                                                <><PhoneCall className="w-4 h-4 mr-2" /> Start Video Call</>
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {(!isStudent || evt.isActive) && (
                                                        isStudent && (evt.type === 'lecture' || evt.type === 'exam') && activeProctoringId !== evt.id ? (
                                                            <button 
                                                                onClick={() => setActiveProctoringId(evt.id)}
                                                                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold transition shadow-sm"
                                                            >
                                                                <Video className="w-4 h-4 mr-2" /> Start Monitored Session to Join
                                                            </button>
                                                        ) : (
                                                            <a href={evt.meetingUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${isPast ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                                                                <Video className="w-4 h-4 mr-2" /> Join Video Call
                                                            </a>
                                                        )
                                                    )}

                                                    {isStudent && !evt.isActive && (
                                                        <span className="inline-flex items-center px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-bold cursor-not-allowed">
                                                            <Video className="w-4 h-4 mr-2 opacity-50" /> Waiting for Instructor...
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {activeProctoringId === evt.id && (
                                                    <div className="mt-2">
                                                        <ProctoringSession assessmentTitle={evt.title} onComplete={() => setActiveProctoringId(null)} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

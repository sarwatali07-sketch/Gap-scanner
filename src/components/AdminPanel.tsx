import React, { useState, useEffect } from 'react';
import { getSubjectsConfig, saveSubjectConfig, AdminSubjectConfig } from '../lib/dbService';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit, 
  BookOpen, 
  FolderPlus, 
  PlusCircle, 
  CheckCircle,
  FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [configs, setConfigs] = useState<AdminSubjectConfig[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Adding subjects
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Adding chapters
  const [newChapterName, setNewChapterName] = useState('');
  
  // Adding topics
  const [newTopicName, setNewTopicName] = useState('');
  const [targetChapterIdx, setTargetChapterIdx] = useState<number>(0);

  const [notif, setNotif] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    const data = await getSubjectsConfig();
    setConfigs(data);
    if (data.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(data[0].id);
    }
  };

  const activeSubject = configs.find(c => c.id === selectedSubjectId);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    const cleanId = newSubjectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if duplicate
    if (configs.some(c => c.id === cleanId)) {
      setNotif('Error: Subject already exists!');
      setTimeout(() => setNotif(''), 3000);
      return;
    }

    const newConfig: AdminSubjectConfig = {
      id: cleanId,
      name: newSubjectName,
      chapters: []
    };

    await saveSubjectConfig(newConfig);
    setNewSubjectName('');
    setNotif(`Subject "${newSubjectName}" added successfully!`);
    await loadConfigs();
    setSelectedSubjectId(cleanId);
    setTimeout(() => setNotif(''), 3000);
  };

  const handleAddChapter = async () => {
    if (!activeSubject || !newChapterName.trim()) return;
    
    const updatedSubject: AdminSubjectConfig = {
      ...activeSubject,
      chapters: [
        ...activeSubject.chapters,
        { name: newChapterName, topics: [] }
      ]
    };

    await saveSubjectConfig(updatedSubject);
    setNewChapterName('');
    setNotif(`Chapter "${newChapterName}" added!`);
    await loadConfigs();
    setTimeout(() => setNotif(''), 3000);
  };

  const handleAddTopic = async () => {
    if (!activeSubject || !newTopicName.trim()) return;
    const chapters = [...activeSubject.chapters];
    const targetChapter = chapters[targetChapterIdx];
    
    if (!targetChapter) return;

    targetChapter.topics.push(newTopicName);
    
    const updatedSubject: AdminSubjectConfig = {
      ...activeSubject,
      chapters
    };

    await saveSubjectConfig(updatedSubject);
    setNewTopicName('');
    setNotif(`Topic "${newTopicName}" added to Chapter ${targetChapter.name}!`);
    await loadConfigs();
    setTimeout(() => setNotif(''), 3000);
  };

  const handleDeleteTopic = async (chapterIdx: number, topicIdx: number) => {
    if (!activeSubject) return;
    const chapters = [...activeSubject.chapters];
    chapters[chapterIdx].topics.splice(topicIdx, 1);

    const updatedSubject: AdminSubjectConfig = {
      ...activeSubject,
      chapters
    };

    await saveSubjectConfig(updatedSubject);
    setNotif('Topic deleted successfully.');
    await loadConfigs();
    setTimeout(() => setNotif(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" id="admin_workspace">
      
      {/* Header */}
      <div id="admin_header">
        <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
          <Database className="w-6.5 h-6.5 text-indigo-600" />
          Syllabus & Curriculum Editor (Admin)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Add or structure school boards, subject parameters, chapter indices, and topics. Updates propagate instantly to all students without changing application code.
        </p>
      </div>

      {notif && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-pulse" id="admin_notification">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="admin_grid">
        
        {/* Subject management panel */}
        <div className="md:col-span-1 space-y-4" id="admin_subject_col">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Subjects Database
            </h3>

            {/* List */}
            <div className="space-y-1.5" id="admin_subjects_list">
              {configs.map(c => (
                <button
                  id={`admin_sub_btn_${c.id}`}
                  key={c.id}
                  onClick={() => setSelectedSubjectId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
                    selectedSubjectId === c.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    selectedSubjectId === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.chapters.length} Chapters
                  </span>
                </button>
              ))}
            </div>

            {/* Add Subject form */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5" id="add_subject_form">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Create New Subject</label>
              <div className="flex gap-2">
                <input
                  id="admin_new_sub_input"
                  type="text"
                  placeholder="e.g. Geography"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
                <button
                  id="admin_add_sub_btn"
                  onClick={handleAddSubject}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters & Topics manager */}
        <div className="md:col-span-2 space-y-4" id="admin_chapters_col">
          {activeSubject ? (
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4" id="admin_syllabus_header">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Syllabus Architecture</span>
                  <h3 className="text-lg font-bold text-slate-850 mt-0.5">{activeSubject.name} Curriculum</h3>
                </div>

                {/* Add chapter trigger */}
                <div className="flex gap-2 w-full sm:w-auto" id="add_chapter_form">
                  <input
                    id="admin_new_chapter_input"
                    type="text"
                    placeholder="New Chapter Name..."
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none w-full sm:w-44"
                  />
                  <button
                    id="admin_add_chapter_btn"
                    onClick={handleAddChapter}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>
              </div>

              {/* Chapters list */}
              <div className="space-y-4" id="chapters_accordion_list">
                {activeSubject.chapters.length === 0 ? (
                  <p className="text-center text-slate-400 text-xs py-8">No chapters found for this subject. Use the builder on the right to add some!</p>
                ) : (
                  activeSubject.chapters.map((ch, chIdx) => (
                    <div 
                      key={ch.name}
                      className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-50 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                          {ch.name}
                        </span>
                        
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{ch.topics.length} Topics</span>
                      </div>

                      {/* Topics */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex flex-wrap gap-2" id={`topics_badges_ch_${chIdx}`}>
                          {ch.topics.map((t, tIdx) => (
                            <span 
                              key={t}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[11px] font-semibold text-indigo-700"
                            >
                              <span>{t}</span>
                              <button
                                id={`admin_del_topic_${chIdx}_${tIdx}`}
                                onClick={() => handleDeleteTopic(chIdx, tIdx)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add topic for this specific chapter */}
                        <div className="pt-3 border-t border-slate-100 flex gap-2" id={`add_topic_for_ch_${chIdx}`}>
                          <input
                            id={`admin_new_topic_input_ch_${chIdx}`}
                            type="text"
                            placeholder="Add Topic..."
                            value={targetChapterIdx === chIdx ? newTopicName : ''}
                            onChange={(e) => {
                              setTargetChapterIdx(chIdx);
                              setNewTopicName(e.target.value);
                            }}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none w-44"
                          />
                          <button
                            id={`admin_add_topic_btn_ch_${chIdx}`}
                            onClick={handleAddTopic}
                            className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          ) : (
            <p className="text-center text-slate-400 text-xs py-16 bg-white border border-slate-100 rounded-[24px] shadow-sm">Select a subject from the left panel to begin structural configurations.</p>
          )}
        </div>

      </div>

    </div>
  );
}

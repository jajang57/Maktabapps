import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../context/ThemeContext'; // tambahkan import ini

export default function MasterProject() {
  const { theme } = useTheme(); // gunakan theme

  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    nama_project: '',
    kode_project: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [previewCode, setPreviewCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        // Update existing
        const requestData = {
          nama_project: formData.nama_project.trim()
        };
        
        console.log('Updating project:', requestData);
        
        await api.put(`/master-project/${editingId}`, requestData);
        alert('Project berhasil diupdate.');
        
        // Reset form setelah update
        handleCancel();
      } else {
        // Add new
        const requestData = { 
          nama_project: formData.nama_project.trim()
        };
        
        console.log('Creating project:', requestData);
        
        const response = await api.post('/master-project', requestData);
        
        console.log('Response:', response.data);
        
        const newProject = response.data.data;
        alert(`Project baru berhasil disimpan dengan kode: ${newProject.kode_project}`);
        
        // Reset form setelah create
        setFormData({ 
          nama_project: '',
          kode_project: '' 
        });
        
        // ✅ PERBAIKAN: Refetch data dan tunggu sampai selesai
        await fetchProjects();
        
        // ✅ Preview akan otomatis terupdate via useEffect
        // Tidak perlu setTimeout lagi!
      }
      
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error response:", error.response);
      const errorMessage = error.response?.data?.error || 'Gagal menyimpan data.';
      alert(`Error: ${errorMessage}`);
    }
  };

  // Fungsi untuk generate preview kode project (FIXED - Monthly grouping)
  const generatePreviewCode = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const datePart = `${day}${month}${year}`;
    
    console.log('=== DEBUGGING PREVIEW CODE ===');
    console.log('Current date:', now);
    console.log('Current month:', now.getMonth(), 'Current year:', now.getFullYear());
    
    // DEBUGGING: Check all projects first
    console.log('All projects:', projects);
    projects.forEach((project, index) => {
      console.log(`Project ${index}:`, {
        kode: project.kode_project,
        created_at: project.created_at,
        CreatedAt: project.CreatedAt, // Check alternative field name
        all_fields: Object.keys(project)
      });
    });
    
    // ✅ FALLBACK: Jika created_at undefined, pakai count semua project hari ini
    let monthlyProjects;
    
    if (projects.length > 0 && projects[0].created_at === undefined) {
      console.log('⚠️ created_at field missing! Using fallback logic...');
      
      // Fallback: Hitung semua project yang ada dengan kode hari ini
      const todayPrefix = `Pro/${datePart}`;
      monthlyProjects = projects.filter(project => 
        project.kode_project && project.kode_project.startsWith(todayPrefix)
      );
      
      console.log('Fallback: Projects with today prefix:', monthlyProjects);
    } else {
      // Normal logic
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      monthlyProjects = projects.filter(project => {
        if (project.created_at) {
          const projectDate = new Date(project.created_at);
          const projectMonth = projectDate.getMonth();
          const projectYear = projectDate.getFullYear();
          
          console.log(`Filtering project:`, {
            kode: project.kode_project,
            projectMonth,
            projectYear,
            currentMonth,
            currentYear,
            bothMatch: projectMonth === currentMonth && projectYear === currentYear
          });
          
          return projectMonth === currentMonth && projectYear === currentYear;
        }
        return false;
      });
    }
    
    console.log('Filtered monthly projects:', monthlyProjects);
    
    const nextSequence = monthlyProjects.length + 1;
    const sequencePart = String(nextSequence).padStart(3, '0');
    
    const previewCode = `Pro/${datePart}/${sequencePart}`;
    console.log('Generated preview code:', previewCode, 'Monthly projects count:', monthlyProjects.length);
    console.log('=== END DEBUGGING ===');
    
    return previewCode;
  };

  // ✅ PERBAIKAN: useEffect akan auto trigger saat projects berubah
  useEffect(() => {
    if (!editingId && !isLoading) {
      const preview = generatePreviewCode();
      setPreviewCode(preview);
      console.log('Auto-generated preview code:', preview, 'from projects:', projects.length);
    }
  }, [projects, editingId, isLoading]); // Dependency: projects

  // Fetch data from API
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/master-project');      
      // Debug each project structure
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((project, index) => {
          console.log(`Backend Project ${index} structure:`, Object.keys(project));
          console.log(`Backend Project ${index} data:`, project);
        });
      }
      
      setProjects(response.data.data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      alert('Gagal memuat data project.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama_project.trim()) {
      newErrors.nama_project = 'Nama project wajib diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEdit = (item) => {
    setFormData({ 
      nama_project: item.nama_project,
      kode_project: item.kode_project
    });
    setEditingId(item.ID);
    setPreviewCode(''); // Clear preview saat edit
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data project ini?')) {
      try {
        await api.delete(`/master-project/${id}`);
        alert('Project berhasil dihapus.');
        await fetchProjects(); // Refetch data
      } catch (error) {
        console.error("Error deleting project:", error);
        const errorMessage = error.response?.data?.error || 'Gagal menghapus data.';
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ 
      nama_project: '',
      kode_project: '' 
    });
    setEditingId(null);
    setErrors({});
    // Generate ulang preview setelah cancel
    if (!isLoading && projects.length > 0) {
      const preview = generatePreviewCode();
      setPreviewCode(preview);
    }
  };

  // Filter and pagination logic
  const filteredData = projects.filter(item =>
    (item.nama_project && item.nama_project.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.kode_project && item.kode_project.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div
      className="space-y-6 p-6"
      style={{
        background: theme.backgroundColor,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
        minHeight: "100vh",
      }}
    >
      <h1 className="text-2xl font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
        Master Data Project
      </h1>
      
      {/* Form Input */}
      <Card style={{ background: theme.cardColor }}>
        <CardHeader>
          <CardTitle style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
            {editingId ? 'Edit Project' : 'Tambah Project Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Kode Project
                </label>
                <Input
                  type="text"
                  value={
                    editingId 
                      ? formData.kode_project 
                      : isLoading 
                        ? '(Loading...)' 
                        : (previewCode || '(Generating...)')
                  }
                  disabled
                  style={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                    borderColor: theme.dropdownColor,
                  }}
                />
                {!editingId && (
                  <p className="text-xs mt-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    * Kode akan di-generate otomatis saat menyimpan
                  </p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Nama Project *
                </label>
                <Input
                  type="text"
                  name="nama_project"
                  value={formData.nama_project}
                  onChange={handleInputChange}
                  placeholder="Nama project"
                  className={errors.nama_project ? 'border-red-500' : ''}
                  style={{
                    background: theme.fieldColor,
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily,
                    borderColor: theme.dropdownColor,
                  }}
                />
                {errors.nama_project && <p className="text-red-500 text-xs mt-1">{errors.nama_project}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                style={{
                  background: theme.buttonSimpan,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                {editingId ? 'Update' : 'Simpan'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  style={{
                    background: theme.buttonHapus,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabel Data */}
      <Card style={{ background: theme.cardColor }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Data Project</CardTitle>
            <div className="w-64">
              <Input
                type="text"
                placeholder="Cari project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                  borderColor: theme.dropdownColor,
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Loading data...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ fontFamily: theme.tableFontFamily }}>
                  <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                    <tr>
                      <th className="px-4 py-2 text-left">Kode Project</th>
                      <th className="px-4 py-2 text-left">Nama Project</th>
                      <th className="px-4 py-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <tr key={item.ID} style={{ background: theme.tableBodyColor, color: theme.tableFontColor, fontFamily: theme.tableFontFamily }}>
                          <td className="px-4 py-2">{item.kode_project}</td>
                          <td className="px-4 py-2">{item.nama_project}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                style={{
                                  background: theme.buttonUpdate,
                                  color: "#fff",
                                  fontFamily: theme.fontFamily,
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item.ID)}
                                style={{
                                  background: theme.buttonHapus,
                                  color: "#fff",
                                  fontFamily: theme.fontFamily,
                                }}
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-8 text-center" style={{ color: theme.tableFontColor, background: theme.tableBodyColor, fontFamily: theme.tableFontFamily }}>
                          Tidak ada data project
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      background: theme.buttonRefresh,
                      color: "#fff",
                      fontFamily: theme.fontFamily,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    Sebelumnya
                  </Button>
                  
                  <span className="text-sm" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      background: theme.buttonSimpan,
                      color: "#fff",
                      fontFamily: theme.fontFamily,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

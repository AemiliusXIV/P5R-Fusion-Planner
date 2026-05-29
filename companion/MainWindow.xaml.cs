using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Navigation;
using Microsoft.Win32;

namespace P5RCompanion;

public partial class MainWindow : Window
{
    private const string PwaBaseUrl = "https://aemiliusxiv.github.io/P5R-Fusion-Planner";

    private string? _saveFolder;
    private string? _lastGeneratedJson;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
    }

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        DetectSaves();
    }

    private void DetectSaves()
    {
        _saveFolder = SaveFileLocator.FindSaveFolder();
        if (_saveFolder == null)
        {
            SaveFolderText.Text = "No P5R save folder found. Have you launched the game on this PC?";
            ReadButton.IsEnabled = false;
            return;
        }

        LoadSlotsFromFolder();
    }

    private void LoadSlotsFromFolder()
    {
        if (_saveFolder == null) return;

        SaveFolderText.Text = _saveFolder;

        var slots = SaveFileLocator.ListSaveSlots(_saveFolder);
        SlotList.Items.Clear();

        if (slots.Count == 0)
        {
            SlotList.Items.Add(new TextBlock
            {
                Text = "No save slots found in folder.",
                Foreground = System.Windows.Media.Brushes.Gray,
                Padding = new Thickness(10),
            });
            ReadButton.IsEnabled = false;
            return;
        }

        foreach (var slot in slots)
        {
            SlotList.Items.Add(new SlotListItem(slot));
        }

        SlotList.SelectedIndex = 0;
        ReadButton.IsEnabled = true;
    }

    private void BrowseButton_Click(object sender, RoutedEventArgs e)
    {
        var dlg = new Microsoft.Win32.OpenFolderDialog
        {
            Title = "Select your P5R save folder",
            Multiselect = false,
        };

        if (_saveFolder != null)
            dlg.InitialDirectory = _saveFolder;

        if (dlg.ShowDialog() == true)
        {
            _saveFolder = dlg.FolderName;
            LoadSlotsFromFolder();
        }
    }

    private void ReadButton_Click(object sender, RoutedEventArgs e)
    {
        if (SlotList.SelectedItem is not SlotListItem item)
        {
            StatusText.Text = "Select a save slot first.";
            return;
        }

        try
        {
            StatusText.Text = "Reading save file…";

            // Read bytes into memory; never opens with write access
            var fileBytes = SaveFileLocator.ReadFileBytes(item.Slot.FilePath);

            // Decrypt & decompress (original file untouched)
            var contents = Decryption.Read(fileBytes);

            // Parse compendium only
            var owned = CompendiumReader.ReadOwnedPersonas(contents.Data);

            // Build JSON for the PWA
            _lastGeneratedJson = ImportPayload.BuildJson(owned);

            StatusText.Text = $"✓ Found {owned.Count} owned personas. " +
                              $"Save: Day {contents.CalendarDay}, " +
                              $"{contents.PlaytimeSeconds / 3600}h{(contents.PlaytimeSeconds % 3600) / 60:D2}m played, " +
                              $"Lv {contents.Level}.";

            OpenButton.IsEnabled = true;
            CopyLinkButton.IsEnabled = true;
            SaveJsonButton.IsEnabled = true;
        }
        catch (Exception ex)
        {
            StatusText.Text = $"Failed: {ex.Message}";
            OpenButton.IsEnabled = false;
            CopyLinkButton.IsEnabled = false;
            SaveJsonButton.IsEnabled = false;
            _lastGeneratedJson = null;
        }
    }

    private void OpenButton_Click(object sender, RoutedEventArgs e)
    {
        if (_lastGeneratedJson == null) return;

        var url = ImportPayload.BuildDeepLink(PwaBaseUrl, _lastGeneratedJson);

        try
        {
            Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
            StatusText.Text = "✓ Opened browser. The PWA will auto-import.";
        }
        catch (Exception ex)
        {
            StatusText.Text = $"Could not open browser: {ex.Message}";
        }
    }

    private void CopyLinkButton_Click(object sender, RoutedEventArgs e)
    {
        if (_lastGeneratedJson == null) return;
        var url = ImportPayload.BuildDeepLink(PwaBaseUrl, _lastGeneratedJson);
        Clipboard.SetText(url);
        StatusText.Text = "✓ Link copied. Paste it into your browser address bar, or use the Paste Import field on the PWA settings page.";
    }

    private void SaveJsonButton_Click(object sender, RoutedEventArgs e)
    {
        if (_lastGeneratedJson == null) return;

        var dlg = new SaveFileDialog
        {
            FileName = "p5r-owned.json",
            DefaultExt = ".json",
            Filter = "JSON files (.json)|*.json",
        };

        if (dlg.ShowDialog() == true)
        {
            try
            {
                ImportPayload.WriteJsonToFile(dlg.FileName, _lastGeneratedJson);
                StatusText.Text = $"✓ Saved JSON to {Path.GetFileName(dlg.FileName)}.";
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Could not save: {ex.Message}";
            }
        }
    }

    private void Hyperlink_RequestNavigate(object sender, RequestNavigateEventArgs e)
    {
        Process.Start(new ProcessStartInfo { FileName = e.Uri.AbsoluteUri, UseShellExecute = true });
        e.Handled = true;
    }
}

/// <summary>
/// ListBox item that renders a save slot with its key details.
/// </summary>
internal class SlotListItem : StackPanel
{
    public SaveFileLocator.SaveSlot Slot { get; }

    public SlotListItem(SaveFileLocator.SaveSlot slot)
    {
        Slot = slot;
        Orientation = Orientation.Horizontal;

        Children.Add(new TextBlock
        {
            Text = slot.SlotName,
            FontWeight = FontWeights.Bold,
            Width = 80,
            Foreground = System.Windows.Media.Brushes.White,
        });

        Children.Add(new TextBlock
        {
            Text = $"Modified {slot.LastModified:yyyy-MM-dd HH:mm}",
            Foreground = (System.Windows.Media.Brush)System.Windows.Application.Current.Resources["P5Gray"],
            Width = 200,
        });

        Children.Add(new TextBlock
        {
            Text = $"{slot.SizeBytes / 1024} KB",
            Foreground = (System.Windows.Media.Brush)System.Windows.Application.Current.Resources["P5Gray"],
        });
    }
}
